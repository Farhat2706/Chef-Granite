"""
LLM wrapper — Groq (free tier) with a LangChain-compatible interface.
Falls back to a simple demo stub when no API key is configured, so the app
still runs for local UI development without any credentials.
"""
from __future__ import annotations

import re
from typing import Any

from config import get_settings

settings = get_settings()


# ---------------------------------------------------------------------------
# Groq LLM
# ---------------------------------------------------------------------------
def _build_groq_llm():
    """Try to build a Groq-backed chat LLM. Returns None on import/config error."""
    try:
        from langchain_groq import ChatGroq  # type: ignore

        if not settings.groq_api_key or settings.groq_api_key.startswith("your_"):
            return None

        return ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model_id,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Chef Granite, a warm and knowledgeable AI recipe assistant.
You have access to a knowledge base of recipes and cooking guides.
Your job is to:
1. Answer cooking and recipe questions using retrieved context.
2. Adapt recipes based on dietary restrictions (vegan, gluten-free, dairy-free, sugar-free, etc.).
3. Suggest ingredient substitutions when needed.
4. Provide step-by-step instructions clearly.
5. Generate shopping lists when asked.
6. Estimate nutritional information when possible.

Always be friendly, encouraging, and make cooking feel approachable and fun!
If the retrieved context does not contain the answer, use your general culinary knowledge and say so.

## Formatting rules (strictly follow these):
- Use Markdown headings (##, ###) to separate sections like Ingredients, Instructions, Substitutions, Tips.
- Use bullet points (-) for ingredients, substitutions, shopping lists, and tips.
- Use numbered lists (1. 2. 3.) for step-by-step instructions only.
- NEVER use Markdown tables or the pipe "|" character anywhere in your response.
- NEVER use HTML tags.
- Keep each section clearly labelled and separated with a blank line.
- Be concise — one ingredient or step per line.
"""


# ---------------------------------------------------------------------------
# Structured response parser
# ---------------------------------------------------------------------------
def _parse_structured_response(raw: str) -> dict[str, Any]:
    """
    Attempt to extract structured fields from the LLM's free-form text response.
    Returns a dict with keys: answer, steps, substitutions, shopping_list, nutrition.
    """
    result: dict[str, Any] = {
        "answer": raw.strip(),
        "steps": [],
        "substitutions": [],
        "shopping_list": [],
        "nutrition": {},
    }

    lines = raw.split("\n")
    current_section = "answer"
    answer_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        lower = stripped.lower()

        # Detect section headers
        if any(kw in lower for kw in ["step", "instruction", "direction", "method"]):
            current_section = "steps"
            continue
        elif any(kw in lower for kw in ["substitut", "swap", "replace", "alternative"]):
            current_section = "substitutions"
            continue
        elif any(kw in lower for kw in ["shopping list", "ingredients needed", "buy"]):
            current_section = "shopping_list"
            continue
        elif any(kw in lower for kw in ["nutrition", "calorie", "macro", "protein", "carb", "fat"]):
            current_section = "nutrition_text"
            continue

        # Numbered / bulleted list items
        is_list_item = bool(re.match(r"^(\d+[\.\)]\s+|[-*]\s+)", stripped))
        clean = re.sub(r"^(\d+[\.\)]\s+|[-*]\s+)", "", stripped)

        if current_section == "steps" and (is_list_item or stripped[0].isdigit()):
            result["steps"].append(clean)
        elif current_section == "substitutions" and is_list_item:
            result["substitutions"].append(clean)
        elif current_section == "shopping_list" and is_list_item:
            result["shopping_list"].append(clean)
        elif current_section == "nutrition_text":
            existing = result["nutrition"].get("text", "")
            result["nutrition"]["text"] = (existing + " " + stripped).strip()
        else:
            answer_lines.append(stripped)

    if answer_lines:
        result["answer"] = " ".join(answer_lines)

    return result


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------
class RecipeAgent:
    """High-level agent: retrieves context then generates a structured answer."""

    def __init__(self):
        self._llm = _build_groq_llm()
        self._demo_mode = self._llm is None

    @property
    def demo_mode(self) -> bool:
        return self._demo_mode

    def answer(
        self,
        question: str,
        context_docs: list,
        history: list[dict] | None = None,
    ) -> dict[str, Any]:
        history = history or []

        # Build context from retrieved docs
        context_parts = []
        sources: list[str] = []
        for doc in context_docs:
            context_parts.append(doc.page_content)
            src = doc.metadata.get("source", "")
            if src and src not in sources:
                sources.append(src)

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No specific recipe context found."

        if self._demo_mode:
            raw = self._demo_response(question, context)
        else:
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore

            # Include last 4 turns of history
            messages: list = [SystemMessage(content=SYSTEM_PROMPT)]
            for turn in history[-4:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                else:
                    from langchain_core.messages import AIMessage  # type: ignore
                    messages.append(AIMessage(content=content))

            messages.append(HumanMessage(
                content=f"Retrieved Recipe Context:\n{context}\n\nQuestion: {question}"
            ))

            response = self._llm.invoke(messages)  # type: ignore[union-attr]
            raw = response.content if hasattr(response, "content") else str(response)
            # Strip any table rows the LLM may have generated despite instructions
            raw = "\n".join(
                line for line in raw.splitlines()
                if not (line.strip().startswith("|") or line.strip().startswith("|-"))
            )

        parsed = _parse_structured_response(raw)
        parsed["sources"] = sources
        parsed["demo_mode"] = self._demo_mode
        return parsed

    # ------------------------------------------------------------------
    # Demo / fallback response — used when no API key is configured
    # ------------------------------------------------------------------
    def _demo_response(self, question: str, context: str) -> str:
        if context and "No specific recipe" not in context:
            preview = context[:600].replace("\n", " ")
            return (
                f"Based on our recipe collection, here's what I found:\n\n"
                f"{preview}...\n\n"
                "Steps:\n"
                "1. Gather your ingredients as listed above.\n"
                "2. Follow the preparation instructions carefully.\n"
                "3. Cook at the recommended temperature and time.\n"
                "4. Taste and adjust seasoning before serving.\n\n"
                "Substitutions:\n"
                "- For a vegan version, replace dairy products with plant-based alternatives.\n"
                "- For gluten-free, substitute regular flour with a 1:1 gluten-free blend.\n\n"
                "Shopping List:\n"
                "- Check the ingredients section above for the full list.\n"
                "- Add staples like olive oil, salt, and pepper if not already in your pantry.\n\n"
                "Note: Add your Groq API key to .env for full AI-powered responses."
            )

        return (
            "I'm Chef Granite, your recipe assistant! I'm currently running in demo mode.\n\n"
            "To get full AI-powered recipe answers:\n"
            "1. Get a free Groq API key at https://console.groq.com\n"
            "2. Add GROQ_API_KEY=your_key to the backend/.env file.\n"
            "3. Restart the backend, then upload recipe documents and start asking!\n\n"
            "Steps:\n"
            "1. Visit console.groq.com and sign up for free.\n"
            "2. Create an API key and copy it.\n"
            "3. Paste it into backend/.env as GROQ_API_KEY=...\n\n"
            "Substitutions:\n"
            "- Eggs -> flax eggs (1 tbsp ground flaxseed + 3 tbsp water)\n"
            "- Butter -> coconut oil or vegan butter\n"
            "- Milk -> oat milk, almond milk, or soy milk\n"
        )


# Singleton
_agent: RecipeAgent | None = None


def get_agent() -> RecipeAgent:
    global _agent
    if _agent is None:
        _agent = RecipeAgent()
    return _agent
