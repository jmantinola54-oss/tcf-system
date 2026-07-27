'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ChecklistView({ pillId, initialSections, isAdmin }) {
  const supabase = createClient()
  const router = useRouter()
  const [newSectionLabel, setNewSectionLabel] = useState('')
  const [newItemLabel, setNewItemLabel] = useState({}) // { [sectionId]: text }
  const [busy, setBusy] = useState(false)

  async function toggleItem(itemId, currentChecked) {
    const { error } = await supabase
      .from('checklist_items')
      .update({ checked: !currentChecked })
      .eq('id', itemId)
    if (error) {
      alert("Couldn't update — you may not have permission to edit this item.\n\n" + error.message)
      return
    }
    router.refresh()
  }

  async function addSection() {
    if (!newSectionLabel.trim()) return
    setBusy(true)
    const { error } = await supabase.from('sections').insert({
      pill_id: pillId,
      label: newSectionLabel.trim(),
      sort_order: initialSections.length,
    })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    setNewSectionLabel('')
    router.refresh()
  }

  async function addItem(sectionId) {
    const text = (newItemLabel[sectionId] || '').trim()
    if (!text) return
    setBusy(true)
    const { error } = await supabase.from('checklist_items').insert({
      section_id: sectionId,
      label: text,
    })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    setNewItemLabel(prev => ({ ...prev, [sectionId]: '' }))
    router.refresh()
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {initialSections.map(section => (
        <div key={section.id} style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#204A2E', borderBottom: '2px solid #e0e0e0', paddingBottom: 6 }}>{section.label}</h3>
          {section.checklist_items?.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No items yet.</p>}
          {section.checklist_items?.map(item => (
            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid #f2f2f2' }}>
              <input type="checkbox" checked={!!item.checked} onChange={() => toggleItem(item.id, item.checked)} />
              <span style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#999' : '#222' }}>
                {item.label}
              </span>
              {item.priority && item.priority !== 'medium' && (
                <span style={{ fontSize: 11, color: item.priority === 'critical' ? '#C0282A' : '#B06800', fontWeight: 'bold' }}>
                  {item.priority}
                </span>
              )}
              {item.due_date && <span style={{ fontSize: 11, color: '#888' }}>Due {item.due_date}</span>}
            </label>
          ))}

          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                placeholder="Add item…"
                value={newItemLabel[section.id] || ''}
                onChange={e => setNewItemLabel(prev => ({ ...prev, [section.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem(section.id)}
                style={{ flex: 1, padding: '6px 10px' }}
              />
              <button onClick={() => addItem(section.id)} disabled={busy}>+ Add</button>
            </div>
          )}
        </div>
      ))}

      {isAdmin && (
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '2px dashed #ccc', display: 'flex', gap: 8 }}>
          <input
            placeholder="New section name…"
            value={newSectionLabel}
            onChange={e => setNewSectionLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSection()}
            style={{ flex: 1, padding: '6px 10px' }}
          />
          <button onClick={addSection} disabled={busy}>+ Add section</button>
        </div>
      )}
    </div>
  )
}