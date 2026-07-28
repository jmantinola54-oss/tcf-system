'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, MoreVertical, Link2, Trash2, ChevronRight, ChevronDown, StickyNote, Plus } from 'lucide-react'
import { logActivity } from '../../../lib/audit'

const STATUS_STYLE = {
  not_started: { bg: '#F0EAF0', color: '#6C6080', label: 'Not Started' },
  in_progress: { bg: '#FFF3DC', color: '#B06800', label: 'In Progress' },
  pending_review: { bg: '#E9F5EC', color: '#204A2E', label: 'Pending Review' },
  completed: { bg: '#E1F7EC', color: '#16A35A', label: 'Completed' },
  overdue: { bg: '#FDEAEA', color: '#C0282A', label: 'Overdue' },
  na: { bg: '#F0EAF0', color: '#6C6080', label: 'N/A' },
}

function initialsOf(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function ItemRow({ item, onEdit, level = 0, categories = [] }) {
  const supabase = createClient()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [addingSub, setAddingSub] = useState(false)
  const [subLabel, setSubLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [showRemarks, setShowRemarks] = useState(false)
  const [showLinks, setShowLinks] = useState(false)

  const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started
  const children = item.children || []
  const assignee = item.task_assignments?.[0]?.profiles
  const categoryObj = categories.find(c => c.name === item.category)

  async function toggleItem() {
    const { error } = await supabase.from('checklist_items').update({ checked: !item.checked }).eq('id', item.id)
    if (error) { alert("Couldn't update — you may not have permission.\n\n" + error.message); return }
    await logActivity(supabase, item.checked ? 'item_unchecked' : 'item_checked', { label: item.label })
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.label}"${children.length ? ' and its sub-items' : ''}?`)) return
    const { error } = await supabase.from('checklist_items').delete().eq('id', item.id)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'item_deleted', { label: item.label })
    router.refresh()
  }

  async function submitSubItem() {
    if (!subLabel.trim()) return
    setBusy(true)
    const { error } = await supabase.from('checklist_items').insert({
      section_id: item.section_id, parent_id: item.id, label: subLabel.trim(),
    })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'item_added', { label: subLabel.trim() })
    setSubLabel(''); setAddingSub(false)
    router.refresh()
  }

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f2f2f0] hover:bg-[#FAFAF8] group"
        style={{ paddingLeft: 16 + level * 26 }}
      >
        {children.length > 0 ? (
          <button onClick={() => setExpanded(e => !e)} className="text-[#999] flex-shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <button
          onClick={toggleItem}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            item.checked ? 'bg-[#16A35A] border-[#16A35A]' : 'border-[#ccc] hover:border-[#0f3d28]'
          }`}
        >
          {item.checked && <span className="text-white text-[11px] leading-none">✓</span>}
        </button>

        <span className={`flex-1 text-[13.5px] ${item.checked ? 'line-through text-[#aaa]' : 'text-[#222]'}`}>
          {item.label}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {assignee && (
            <span
              className="w-6 h-6 rounded-full bg-[#204A2E] text-white text-[10px] font-bold flex items-center justify-center"
              title={assignee.full_name || assignee.email}
            >
              {initialsOf(assignee.full_name || assignee.email)}
            </span>
          )}

          {item.category && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full text-white whitespace-nowrap"
              style={{ background: categoryObj?.color || '#0f3d28' }}
            >
              {item.category}
            </span>
          )}

          {item.due_date && (
            <span className="text-[10.5px] text-[#888] bg-[#f2f2f0] px-2 py-1 rounded-full whitespace-nowrap">
              {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {item.remarks && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowRemarks(o => !o); setShowLinks(false) }}
                className="text-[#B06800] hover:opacity-70"
              >
                <StickyNote size={13} />
              </button>
              {showRemarks && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowRemarks(false)} />
                  <div className="absolute right-0 top-6 w-56 bg-white border border-[#eee] rounded-lg shadow-lg p-3 z-[100]">
                    <div className="text-[10px] font-bold text-[#B06800] uppercase mb-1">Remarks</div>
                    <div className="text-xs text-[#333] whitespace-pre-wrap">{item.remarks}</div>
                  </div>
                </>
              )}
            </div>
          )}

          {item.doc_links?.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowLinks(o => !o); setShowRemarks(false) }}
                className="text-[#888] hover:text-[#0f3d28]"
              >
                <Link2 size={13} />
              </button>
              {showLinks && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowLinks(false)} />
                  <div className="absolute right-0 top-6 w-64 bg-white border border-[#eee] rounded-lg shadow-lg p-2 z-[100]">
                    <div className="text-[10px] font-bold text-[#888] uppercase px-1 mb-1">Document Links</div>
                    {item.doc_links.map((link, idx) => (
                      
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-2 py-1.5 text-xs text-blue-600 hover:bg-[#F5FAF6] rounded-md truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {item.priority && item.priority !== 'medium' && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.priority === 'critical' ? 'bg-[#FDEAEA] text-[#C0282A]' : 'bg-[#FFF3DC] text-[#B06800]'}`}>
              {item.priority}
            </span>
          )}
          <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>

          <button onClick={() => onEdit(item)} className="text-[#999] hover:text-[#0f3d28] opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={14} />
          </button>

          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="text-[#999] hover:text-[#0f3d28] opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 bg-white border border-[#eee] rounded-lg shadow-lg py-1 w-36 z-[100]">
                  {level === 0 && (
                    <button
                      onClick={() => { setMenuOpen(false); setAddingSub(true); setExpanded(true) }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#204A2E] hover:bg-[#F5FAF6] flex items-center gap-1.5"
                    >
                      <Plus size={12} /> Add sub-item
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete() }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded && children.map(child => (
        <ItemRow key={child.id} item={child} onEdit={onEdit} level={level + 1} categories={categories} />
      ))}

      {addingSub && (
        <div className="flex gap-2 px-4 py-2 bg-[#FAFAF8]" style={{ paddingLeft: 16 + (level + 1) * 26 }}>
          <input
            autoFocus
            placeholder="Sub-item name…"
            value={subLabel}
            onChange={e => setSubLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSubItem()}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-1.5 text-xs"
          />
          <button onClick={submitSubItem} disabled={busy} className="px-3 py-1.5 bg-[#0f3d28] text-white rounded-lg text-xs font-semibold">Add</button>
          <button onClick={() => setAddingSub(false)} className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs">Cancel</button>
        </div>
      )}
    </div>
  )
}