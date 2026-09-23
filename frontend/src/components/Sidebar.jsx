import { deleteSource } from '../api';

const QUICK_PROMPTS = [
  { icon: '🌱', text: 'Make it vegan' },
  { icon: '🌾', text: 'Make it gluten-free' },
  { icon: '🍬', text: 'Sugar-free version' },
  { icon: '🛒', text: 'Generate a shopping list' },
  { icon: '⏱️', text: 'Quick version under 30 min' },
  { icon: '💪', text: 'Add more protein' },
];

export default function Sidebar({ sources, onSourceDeleted, onUploadClick, onQuickPrompt, onToast }) {
  const handleDelete = async (name) => {
    try {
      await deleteSource(name);
      onSourceDeleted(name);
      onToast(`🗑️ Removed "${name}"`, 'success');
    } catch (e) {
      onToast(`❌ ${e.response?.data?.detail || e.message}`, 'error');
    }
  };

  return (
    <aside className="sidebar">
      {/* Upload card */}
      <div className="card">
        <div className="card-title">📚 Recipe Library</div>
        <div
          className="upload-area"
          onClick={onUploadClick}
          onKeyDown={(e) => e.key === 'Enter' && onUploadClick()}
          tabIndex={0}
          role="button"
        >
          <div className="upload-icon">📂</div>
          <div className="upload-text">
            <strong>Add Recipe Documents</strong>
            Upload PDFs, TXT, DOCX files or paste recipe text
          </div>
          <div className="upload-types">PDF · TXT · DOCX · HTML</div>
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="card">
          <div className="card-title">📖 Ingested Sources ({sources.length})</div>
          <div className="source-list">
            {sources.map((s) => (
              <div key={s} className="source-item">
                <span className="source-name" title={s}>📄 {s}</span>
                <button
                  className="source-delete"
                  onClick={() => handleDelete(s)}
                  title="Remove source"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources.length === 0 && (
        <div className="card">
          <div className="card-title">📖 Ingested Sources</div>
          <div className="source-empty">
            No documents yet.<br />Upload some recipes to get started!
          </div>
        </div>
      )}

      {/* Quick prompts */}
      <div className="card">
        <div className="card-title">⚡ Quick Adaptations</div>
        <div className="quick-prompts">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.text}
              className="quick-btn"
              onClick={() => onQuickPrompt(p.text)}
            >
              {p.icon} {p.text}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
