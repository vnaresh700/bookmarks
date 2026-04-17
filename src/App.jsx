import React, { useState, useEffect } from 'react';
import { Folder, Map, Layers, Link as LinkIcon, Plus, Trash2, Edit2, FileText } from 'lucide-react';
import './index.css';

const INITIAL_DATA = [
  { id: '1', type: 'project', name: 'Example Project', parentId: null },
  { id: '2', type: 'journey', name: 'Frontend Refactor', parentId: '1' },
  { id: '3', type: 'layer', name: 'UI Components', parentId: '2' },
  { id: '4', type: 'detail', name: 'React Docs', url: 'https://react.dev', notes: '', parentId: '3' },
  { id: '5', type: 'detail', name: 'Important Architecture Note', url: '', notes: 'We should always use functional components for this layer to keep performance high.', parentId: '3' },
];

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('tab-saver-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeIds, setActiveIds] = useState({ project: null, journey: null, layer: null, detail: null });
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'create', type: null, parentId: null, editId: null });
  const [formData, setFormData] = useState({ name: '', url: '', notes: '' });
  const [detailMode, setDetailMode] = useState('link'); // 'link' | 'note'

  const [resizing, setResizing] = useState(null);
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('tab-saver-widths');
    return saved ? JSON.parse(saved) : { project: 250, journey: 250, layer: 250, detail: 300, notePreview: 350 };
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    localStorage.setItem('tab-saver-data', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('tab-saver-widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing) return;
      e.preventDefault();
      setColumnWidths(prev => {
        const newWidth = Math.max(150, Math.min(800, prev[resizing] + e.movementX));
        return { ...prev, [resizing]: newWidth };
      });
    };

    const handleMouseUp = () => {
      if (resizing) {
        setResizing(null);
        document.body.style.cursor = '';
      }
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [resizing]);

  const getChildren = (parentId, type) => {
    return items.filter(val => val.type === type && val.parentId === parentId);
  };

  const handleSelect = (id, type) => {
    if (type === 'project') {
      setActiveIds({ project: id, journey: null, layer: null, detail: null });
    } else if (type === 'journey') {
      setActiveIds(prev => ({ ...prev, journey: id, layer: null, detail: null }));
    } else if (type === 'layer') {
      setActiveIds(prev => ({ ...prev, layer: id, detail: null }));
    } else if (type === 'detail') {
      setActiveIds(prev => ({ ...prev, detail: id }));
    }
  };

  const deleteItem = (id, e) => {
    e.stopPropagation();
    setItems(items.filter(i => i.id !== id));
    
    if (activeIds.project === id) setActiveIds({ project: null, journey: null, layer: null, detail: null });
    if (activeIds.journey === id) setActiveIds(prev => ({ ...prev, journey: null, layer: null, detail: null }));
    if (activeIds.layer === id) setActiveIds(prev => ({ ...prev, layer: null, detail: null }));
    if (activeIds.detail === id) setActiveIds(prev => ({ ...prev, detail: null }));
  };

  const handleEditClick = (e, item) => {
    e.stopPropagation();
    setFormData({ name: item.name, url: item.url || '', notes: item.notes || '' });
    if (item.type === 'detail') {
      setDetailMode(item.url ? 'link' : 'note');
    }
    setModalState({ isOpen: true, mode: 'edit', type: item.type, parentId: item.parentId, editId: item.id });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (modalState.mode === 'create') {
      const newItem = {
        id: Date.now().toString(),
        type: modalState.type,
        name: formData.name,
        parentId: modalState.parentId,
        ...(modalState.type === 'detail' && detailMode === 'link' && { url: formData.url, notes: '' }),
        ...(modalState.type === 'detail' && detailMode === 'note' && { url: '', notes: formData.notes })
      };
      setItems([...items, newItem]);
      
      if (modalState.type !== 'detail') {
         handleSelect(newItem.id, modalState.type);
      }
    } else {
      // Edit logic
      setItems(items.map(i => i.id === modalState.editId ? { 
        ...i, 
        name: formData.name, 
        ...(modalState.type === 'detail' && detailMode === 'link' && { url: formData.url, notes: '' }),
        ...(modalState.type === 'detail' && detailMode === 'note' && { url: '', notes: formData.notes })
      } : i));
    }
    
    setModalState({ isOpen: false, mode: 'create', type: null, parentId: null, editId: null });
    setFormData({ name: '', url: '', notes: '' });
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === item.id) return;
    
    const isSameKind = draggedItem.type === item.type;
    const isValidParent = 
      (draggedItem.type === 'journey' && item.type === 'project') ||
      (draggedItem.type === 'layer' && item.type === 'journey') ||
      (draggedItem.type === 'detail' && item.type === 'layer');

    if (isSameKind || isValidParent) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(item.id);
    }
  };

  const handleDragLeave = (e, item) => {
    if (dragOverId === item.id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e, item) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedItem || draggedItem.id === item.id) return;

    const isSameKind = draggedItem.type === item.type;
    const isValidParent = 
      (draggedItem.type === 'journey' && item.type === 'project') ||
      (draggedItem.type === 'layer' && item.type === 'journey') ||
      (draggedItem.type === 'detail' && item.type === 'layer');

    if (isValidParent) {
      setItems(prevItems => prevItems.map(i => 
        i.id === draggedItem.id ? { ...i, parentId: item.id } : i
      ));
    } else if (isSameKind && draggedItem.parentId === item.parentId) {
      setItems(prevItems => {
        const newItems = [...prevItems];
        const dragIndex = newItems.findIndex(i => i.id === draggedItem.id);
        const dropIndex = newItems.findIndex(i => i.id === item.id);
        
        const [removedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIndex, 0, removedItem);
        return newItems;
      });
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverId(null);
  };

  const renderColumn = (title, type, parentId, IconComponent, activeId) => {
    const list = getChildren(parentId, type);
    const canAdd = parentId !== null || type === 'project';
    
    return (
      <div 
        className="column-wrapper"
        style={{ width: columnWidths[type], minWidth: Math.max(150, columnWidths[type]) }}
      >
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
                onClick={() => {
                  setFormData({ name: '', url: '', notes: '' });
                  setDetailMode('link');
                  setModalState({ isOpen: true, mode: 'create', type, parentId, editId: null });
                }}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <ul className="column-list">
            {list.map(item => {
               // Determine icon conditionally for details
               const ItemIcon = item.type === 'detail' && !item.url ? FileText : IconComponent;
               return (
              <li 
                key={item.id}
                className={`item-row ${activeId === item.id ? 'active' : ''} ${dragOverId === item.id ? 'drag-over' : ''} ${draggedItem?.id === item.id ? 'is-dragging' : ''}`}
                onClick={() => {
                   if (item.type !== 'detail') handleSelect(item.id, type);
                   else {
                      if (item.url) window.open(item.url, '_blank');
                      else handleSelect(item.id, 'detail');
                   }
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={(e) => handleDragLeave(e, item)}
                onDrop={(e) => handleDrop(e, item)}
                onDragEnd={handleDragEnd}
              >
                <div className="item-content">
                  <ItemIcon size={16} className="item-icon" style={{ opacity: 0.7, marginTop: '2px', flexShrink: 0 }} />
                  <div className="item-text-container">
                    <span className="item-name" title={item.name}>{item.name}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button 
                    className="action-btn edit-btn" 
                    onClick={(e) => handleEditClick(e, item)}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    onClick={(e) => deleteItem(item.id, e)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )})}
          </ul>
        </div>
        <div 
          className={`resizer ${resizing === type ? 'is-resizing' : ''}`}
          onMouseDown={() => setResizing(type)}
        />
      </div>
    );
  };
  
  const activeNoteItem = items.find(i => i.id === activeIds.detail);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">Tab Saver</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Save CPU by closing tabs & organizing your links hierarchically. Let's drag & drop!
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
            renderColumn('Complete Details', 'detail', activeIds.layer, LinkIcon, activeIds.detail)}
            
          {activeIds.detail && activeNoteItem && !activeNoteItem.url && (
            <div 
              className="column-wrapper"
              style={{ flex: 1, minWidth: 350 }}
            >
              <div className="column">
                <div className="column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> View Free Text
                  </div>
                  <button className="add-btn" onClick={() => setActiveIds(prev => ({ ...prev, detail: null }))}>
                     <Folder size={16} style={{opacity: 0, width: 0}} /* spacing hack so it matches height */ />  Close
                  </button>
                </div>
                <div className="preview-pane">
                   <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-main)', flexShrink: 0 }}>{activeNoteItem.name}</h2>
                   <textarea
                      className="preview-textarea"
                      placeholder="Start typing your notes... (Saves automatically)"
                      value={activeNoteItem.notes}
                      onChange={(e) => {
                        setItems(prevItems => prevItems.map(i => i.id === activeNoteItem.id ? { ...i, notes: e.target.value } : i));
                      }}
                   />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {modalState.isOpen && (
        <div className="modal-overlay" onClick={() => setModalState({ isOpen: false, mode: 'create', type: null, parentId: null, editId: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>
              {modalState.mode === 'create' ? 'Add New ' : 'Rename / Edit '}
              {modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)}
            </h2>
            
            {modalState.type === 'detail' && (
              <div className="detail-type-selector">
                <label className={`type-option ${detailMode === 'link' ? 'selected' : ''}`}>
                  <input type="radio" value="link" checked={detailMode === 'link'} onChange={() => setDetailMode('link')} /> 
                  <LinkIcon size={16} /> URL Link
                </label>
                <label className={`type-option ${detailMode === 'note' ? 'selected' : ''}`}>
                  <input type="radio" value="note" checked={detailMode === 'note'} onChange={() => setDetailMode('note')} /> 
                  <FileText size={16} /> Free Text
                </label>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <input
                autoFocus
                className="input-field"
                placeholder="Name (e.g. Documentation)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              {modalState.type === 'detail' && detailMode === 'link' && (
                <input
                  className="input-field"
                  placeholder="URL (e.g. https://github.com)"
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              )}
              
              {modalState.type === 'detail' && detailMode === 'note' && (
                <textarea
                  className="input-field"
                  placeholder="Type your free text note here..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  required
                />
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel"
                  onClick={() => setModalState({ isOpen: false, mode: 'create', type: null, parentId: null, editId: null })}
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
