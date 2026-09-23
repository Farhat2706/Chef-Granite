import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RecipeCard from './RecipeCard';

function TypingIndicator() {
  return (
    <div className="message assistant">
      <div className="msg-avatar">🍳</div>
      <div className="msg-content">
        <div className="typing">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="message user">
      <div className="msg-avatar">👤</div>
      <div className="msg-content">
        <div className="msg-bubble">{text}</div>
      </div>
    </div>
  );
}

function AssistantMessage({ msg }) {
  const hasStructured = msg.steps?.length || msg.substitutions?.length ||
                        msg.shopping_list?.length || msg.nutrition?.text;
  return (
    <div className="message assistant">
      <div className="msg-avatar">🍳</div>
      <div className="msg-content">
        <div className="msg-bubble">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.answer}
            </ReactMarkdown>
            {msg.demo_mode && (
              <div style={{
                marginTop: 8,
                fontSize: '0.72rem',
                color: 'var(--muted)',
                borderTop: '1px dashed var(--border)',
                paddingTop: 6,
                }}>
                  ⚡ Demo mode — add IBM watsonx.ai credentials for full AI responses
                  </div>
                )}
                </div>
        {hasStructured && (
          <RecipeCard
            steps={msg.steps}
            substitutions={msg.substitutions}
            shopping_list={msg.shopping_list}
            nutrition={msg.nutrition}
            sources={msg.sources}
          />
        )}
      </div>
    </div>
  );
}

const WELCOME_CHIPS = [
  '🍰 How do I make chocolate cake sugar-free?',
  '🌱 Vegan version of chicken tikka masala?',
  '🛒 Give me a shopping list for pasta primavera',
  '🥑 What are some avocado toast variations?',
  '🔄 What can I substitute for eggs in baking?',
  '⏱️ Quick dinner ideas under 30 minutes',
];

export default function ChatArea({ messages, loading, onSend, inputRef }) {
  return (
    <>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-emoji">👩‍🍳</div>
            <h2>Hey there, Foodie! 🌟</h2>
            <p>
              I'm Chef Granite, your AI-powered recipe assistant! Ask me anything about
              cooking, dietary adaptations, ingredient swaps, or generate a shopping list.
            </p>
            <div className="welcome-chips">
              {WELCOME_CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => onSend(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) =>
              msg.role === 'user'
                ? <UserMessage key={i} text={msg.content} />
                : <AssistantMessage key={i} msg={msg} />
            )}
            {loading && <TypingIndicator />}
          </>
        )}
      </div>
    </>
  );
}
