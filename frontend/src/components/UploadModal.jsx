import { useState } from 'react';
import { uploadFile, ingestText } from '../api';

export default function UploadModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('file'); // 'file' | 'text'
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sourceName, setSourceName] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadFile(file);
      onSuccess(`✅ "${file.name}" ingested — ${res.chunks} chunks added!`);
      onClose();
    } catch (e) {
      onSuccess(`❌ ${e.response?.data?.detail || e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const name = sourceName.trim() || 'pasted_recipe';
      const res = await ingestText(text, name);
      onSuccess(`✅ Text ingested as "${name}" — ${res.chunks} chunks added!`);
      onClose();
    } catch (e) {
      onSuccess(`❌ ${e.response?.data?.detail || e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          📚 Add Recipe Documents
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>
            📂 Upload File
          </button>
          <button className={`modal-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
            📝 Paste Text
          </button>
        </div>

        {tab === 'file' ? (
          <div
            className={`modal-drop ${dragging ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="modal-drop-icon">📄</div>
            <strong>Drop a file here or click to browse</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>
              PDF, TXT, DOCX, HTML supported
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.txt,.docx,.doc,.html,.htm"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <>
            <textarea
              className="modal-textarea"
              placeholder="Paste your recipe text here...&#10;&#10;Example:&#10;Classic Banana Bread&#10;Ingredients: 3 ripe bananas, 1/3 cup melted butter..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <input
              className="modal-source-input"
              placeholder="Recipe name (e.g. banana_bread)"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </>
        )}

        {loading && (
          <div className="progress-bar">
            <div className="progress-fill" />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {tab === 'text' && (
            <button className="btn btn-primary" onClick={handleTextSubmit} disabled={loading || !text.trim()}>
              {loading ? 'Adding...' : '✨ Add Recipe'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
