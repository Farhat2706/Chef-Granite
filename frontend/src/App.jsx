import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChat, getSources, getHealth } from './api';
import ChatArea from './components/ChatArea';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [health, setHealth] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Load health + sources on mount ──
  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ demo_mode: true }));
    refreshSources();
  }, []);

  const refreshSources = () => {
    getSources().then(setSources).catch(() => {});
  };

  // ── Toast helper ──
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Send message ──
  const handleSend = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput('');

    // Build history from current messages (last 8 turns)
    const history = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.role === 'user' ? m.content : m.answer || m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const data = await sendChat(question, history);
      setMessages((prev) => [...prev, { role: 'assistant', ...data }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          answer: `Oops! Something went wrong 😅 — ${e.response?.data?.detail || e.message}`,
          steps: [],
          substitutions: [],
          shopping_list: [],
          nutrition: {},
          sources: [],
          demo_mode: false,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  // ── Keyboard submit ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadSuccess = (msg, type = 'success') => {
    showToast(msg, type);
    refreshSources();
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">🍳</span>
          <div>
            <div className="header-title">Chef Granite</div>
            <div className="header-subtitle">AI Recipe Agent · IBM Granite + LangChain RAG</div>
          </div>
        </div>
        <div className="header-actions">
          {health && (
            <span className={`badge ${health.demo_mode ? 'badge-demo' : 'badge-live'}`}>
              {health.demo_mode ? '⚡ Demo Mode' : '🟢 Granite Live'}
            </span>
          )}
          {health && !health.demo_mode && (
            <span className="badge badge-live" style={{ background: 'var(--lavender-100)', color: 'var(--lavender-400)', borderColor: 'var(--lavender-300)' }}>
              {health.ingested_sources} 📚 docs
            </span>
          )}
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            onClick={() => setShowUpload(true)}
          >
            + Add Recipes
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="main-layout">
        <Sidebar
          sources={sources}
          onSourceDeleted={(name) => setSources((s) => s.filter((x) => x !== name))}
          onUploadClick={() => setShowUpload(true)}
          onQuickPrompt={handleSend}
          onToast={showToast}
        />

        <div className="chat-area">
          <ChatArea
            messages={messages}
            loading={loading}
            onSend={handleSend}
          />
          <div ref={messagesEndRef} />

          {/* ── Input ── */}
          <div className="input-area">
            <div className="input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder="Ask me anything — 'How do I make vegan chocolate cake?' 🍫"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="send-btn"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                {loading ? '⏳' : '✈️'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
