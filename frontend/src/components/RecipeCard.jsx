import { useState } from 'react';

const TABS = [
  { key: 'steps',     label: '👩‍🍳 Steps',         emptyMsg: 'No step-by-step guide extracted.' },
  { key: 'subs',      label: '🔄 Substitutions',  emptyMsg: 'No substitutions found.' },
  { key: 'shopping',  label: '🛒 Shopping List',  emptyMsg: 'No shopping list generated.' },
  { key: 'nutrition', label: '🥗 Nutrition',      emptyMsg: 'No nutrition info available.' },
];

function parseNutritionText(text) {
  if (!text) return [];
  const patterns = [
    { key: 'Calories', regex: /(\d+)\s*kcal/i },
    { key: 'Fat',      regex: /fat[:\s]+(\d+)g/i },
    { key: 'Carbs',    regex: /carbs?[:\s]+(\d+)g/i },
    { key: 'Protein',  regex: /protein[:\s]+(\d+)g/i },
    { key: 'Fiber',    regex: /fiber[:\s]+(\d+)g/i },
  ];
  return patterns
    .map(({ key, regex }) => {
      const m = text.match(regex);
      return m ? { label: key, value: key === 'Calories' ? `${m[1]} kcal` : `${m[1]}g` } : null;
    })
    .filter(Boolean);
}

export default function RecipeCard({ steps, substitutions, shopping_list, nutrition, sources }) {
  const [activeTab, setActiveTab] = useState('steps');

  const nutritionItems = parseNutritionText(nutrition?.text || '');

  const hasContent = {
    steps:    steps?.length > 0,
    subs:     substitutions?.length > 0,
    shopping: shopping_list?.length > 0,
    nutrition: nutritionItems.length > 0 || nutrition?.text,
  };

  const visibleTabs = TABS.filter(t => hasContent[t.key]);
  if (visibleTabs.length === 0) return null;

  return (
    <div className="recipe-card">
      <div className="recipe-tabs">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'steps' && (
          steps?.length > 0 ? (
            <ol className="steps-list">
              {steps.map((step, i) => (
                <li key={i} className="step-item">
                  <span className="step-number">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No steps extracted.</p>
        )}

        {activeTab === 'subs' && (
          substitutions?.length > 0 ? (
            <ul className="sub-list">
              {substitutions.map((s, i) => (
                <li key={i} className="sub-item">
                  <span className="sub-icon">✨</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No substitutions found.</p>
        )}

        {activeTab === 'shopping' && (
          shopping_list?.length > 0 ? (
            <ul className="shop-list">
              {shopping_list.map((item, i) => (
                <li key={i} className="shop-item">
                  <span className="shop-icon">🛍️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No shopping list generated.</p>
        )}

        {activeTab === 'nutrition' && (
          nutritionItems.length > 0 ? (
            <div className="nutrition-box">
              {nutritionItems.map((n, i) => (
                <div key={i} className="nutrition-item">
                  <div className="nutrition-label">{n.label}</div>
                  <div className="nutrition-value">{n.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {nutrition?.text || 'No nutrition info available.'}
            </p>
          )
        )}
      </div>

      {sources?.length > 0 && (
        <div className="sources-row">
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginRight: 4 }}>📖 Sources:</span>
          {sources.map((s, i) => (
            <span key={i} className="source-tag">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
