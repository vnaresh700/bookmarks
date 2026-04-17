import React, { useState, useEffect } from 'react';
import { Folder, Map, Layers, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import './index.css';

const INITIAL_DATA = [
  { id: '1', type: 'project', name: 'Example Project', parentId: null },
  { id: '2', type: 'journey', name: 'Frontend Refactor', parentId: '1' },
  { id: '3', type: 'layer', name: 'UI Components', parentId: '2' },
  { id: '4', type: 'detail', name: 'React Docs', url: 'https://react.dev', parentId: '3' },
];

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('tab-saver-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeIds, setActiveIds] = useState({ project: null, journey: null, layer: null });
  const [modalState, setModalState] = useState({ isOpen: false, type: null, parentId: null });
  const [formData, setFormData] = useState({ name: '', url: '' });

  useEffect(() => {
    localStorage.setItem('tab-saver-data', JSON.stringify(items));
  }, [items]);

  const getChildren = (parentId, type) => {
    return items.filter(val => val.type === type && val.parentId === parentId);
  };

  const handleSelect = (id, type) => {
    if (type === 'project') {
      setActiveIds({ project: id, journey: null, layer: null });
    } else if (type === 'journey') {
      setActiveIds(prev => ({ ...prev, journey: id, layer: null }));
    } else if (type === 'layer') {
      setActiveIds(prev => ({ ...prev, layer: id }));
    }
  };

  const deleteItem = (id, e) => {
    e.stopPropagation();
    setItems(items.filter(i => i.id !== id));
    
    if (activeIds.project === id) setActiveIds({ project: null, journey: null, layer: null });
    if (activeIds.journey === id) setActiveIds(prev => ({ ...prev, journey: null, layer: null }));
    if (activeIds.layer === id) setActiveIds(prev => ({ ...prev, layer: null }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const newItem = {
      id: Date.now().toString(),
      type: modalState.type,
      name: formData.name,
      parentId: modalState.parentId,
      ...(modalState.type === 'detail' && { url: formData.url })
    };
    setItems([...items, newItem]);
    
    if (modalState.type !== 'detail') {
       handleSelect(newItem.id, modalState.type);
    }
    
    setModalState({ isOpen: false, type: null, parentId: null });
    setFormData({ name: '', url: '' });
  };

  const renderColumn = (title, type, parentId, IconComponent, activeId) => {
    const list = getChildren(parentId, type);
    const canAdd = parentId !== null || type === 'project';
    
    return (
      <div className="column">
        <div className="column-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconComponent size={16} />
            {title}
            <span className="badge">{list.length}</span>
          </div>
          {canAdd && (
            <button 
              className="add-btn" 
              onClick={() => setModalState({ isOpen: true, type, parentId })}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        <ul className="column-list">
          {list.map(item => (
            <li 
              key={item.id}
              className={`item-row ${activeId === item.id ? 'active' : ''}`}
              onClick={() => type !== 'detail' ? handleSelect(item.id, type) : window.open(item.url, '_blank')}
            >
              <div className="item-content">
                <IconComponent size={16} className="item-icon" style={{ opacity: 0.7 }} />
                <span className="item-name">{item.name}</span>
              </div>
              <button 
                className="delete-btn" 
                onClick={(e) => deleteItem(item.id, e)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">Tab Saver</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Save CPU by closing tabs & organizing your links hierarchically.
        </div>
      </header>

      <main className="main-content">
        <div className="columns-container">
          {renderColumn('Projects', 'project', null, Folder, activeIds.project)}
          
          {activeIds.project && 
            renderColumn('Journeys', 'journey', activeIds.project, Map, activeIds.journey)}
            
          {activeIds.journey && 
            renderColumn('Layers', 'layer', activeIds.journey, Layers, activeIds.layer)}
            
          {activeIds.layer && 
            renderColumn('Complete Details', 'detail', activeIds.layer, LinkIcon, null)}
        </div>
      </main>

      {modalState.isOpen && (
        <div className="modal-overlay" onClick={() => setModalState({ isOpen: false, type: null, parentId: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add New {modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)}</h2>
            <form onSubmit={handleAddSubmit}>
              <input
                autoFocus
                className="input-field"
                placeholder="Name (e.g. Documentation)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {modalState.type === 'detail' && (
                <input
                  className="input-field"
                  placeholder="URL (e.g. https://github.com)"
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              )}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel"
                  onClick={() => setModalState({ isOpen: false, type: null, parentId: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
