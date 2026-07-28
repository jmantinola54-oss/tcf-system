'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, MoreVertical, Link2, Trash2, ChevronRight, ChevronDown, StickyNote, Plus, ArrowUp, ArrowDown, Check, X, Ban } from 'lucide-react'
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
  return name.trim().split(/\s+/).map(function (p) { return p[0] }).slice(0, 2).join('').toUpperCase()
}

function openUrl(url) {
  window.open(url, '_blank', 'noreferrer')
}

export default function ItemRow({ item, onEdit, level, categories, isAdmin }) {
  const lvl = level || 0
  const cats = categories || []
  const supabase = createClient()
  const router = useRouter()

  const [openPopup, setOpenPopup] = useState(null)
  const [expanded, setExpanded] = useState(true)
  const [addingSub, setAddingSub] = useState(false)
  const [subLabel, setSubLabel] = useState('')
  const [busy, setBusy] = useState(false)

  const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started
  const children = item.children || []
  const assignee = item.task_assignments && item.task_assignments[0] ? item.task_assignments[0].profiles : null
  const categoryObj = cats.find(function (c) { return c.name === item.category })
  const links = item.doc_links || []

  function togglePopup(name) {
    setOpenPopup(function (cur) { return cur === name ? null : name })
  }

  async function toggleItem() {
    const res = await supabase.from('checklist_items').update({ checked: !item.checked }).eq('id', item.id)
    if (res.error) { alert("Could not update - you may not have permission.\n\n" + res.error.message); return }
    await logActivity(supabase, item.checked ? 'item_unchecked' : 'item_checked', { label: item.label })
    router.refresh()
  }

  async function setStatus(newChecked, newItemStatus) {
    setOpenPopup(null)
    const changes = { checked: newChecked }
    if (newItemStatus) changes.item_status = newItemStatus
    const res = await supabase.from('checklist_items').update(changes).eq('id', item.id)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'item_edited', { label: item.label })
    router.refresh()
  }

  async function handleRename() {
    setOpenPopup(null)
    const label = prompt('Rename item:', item.label)
    if (!label || !label.trim() || label.trim() === item.label) return
    const res = await supabase.from('checklist_items').update({ label: label.trim() }).eq('id', item.id)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'item_edited', { label: label.trim() })
    router.refresh()
  }

  async function handleEditRemark() {
    setOpenPopup(null)
    const remarks = prompt('Remark:', item.remarks || '')
    if (remarks === null) return
    const res = await supabase.from('checklist_items').update({ remarks: remarks.trim() || null }).eq('id', item.id)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'item_edited', { label: item.label })
    router.refresh()
  }

  async function handleDelete() {
    setOpenPopup(null)
    if (!confirm('Delete "' + item.label + '"' + (children.length ? ' and its sub-items' : '') + '?')) return
    const res = await supabase.from('checklist_items').delete().eq('id', item.id)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'item_deleted', { label: item.label })
    router.refresh()
  }

  async function handleMove(direction) {
    setOpenPopup(null)
    setBusy(true)
    let query = supabase.from('checklist_items').select('id, sort_order').eq('section_id', item.section_id).order('sort_order')
    query = item.parent_id ? query.eq('parent_id', item.parent_id) : query.is('parent_id', null)
    const res = await query
    setBusy(false)
    const siblings = res.data
    if (!siblings) return
    const idx = siblings.findIndex(function (s) { return s.id === item.id })
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const other = siblings[swapIdx]
    setBusy(true)
    await supabase.from('checklist_items').update({ sort_order: other.sort_order != null ? other.sort_order : swapIdx }).eq('id', item.id)
    await supabase.from('checklist_items').update({ sort_order: item.sort_order != null ? item.sort_order : idx }).eq('id', other.id)
    setBusy(false)
    router.refresh()
  }

  async function submitSubItem() {
    if (!subLabel.trim()) return
    setBusy(true)
    const res = await supabase.from('checklist_items').insert({
      section_id: item.section_id, parent_id: item.id, label: subLabel.trim(),
    })
    setBusy(false)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'item_added', { label: subLabel.trim() })
    setSubLabel('')
    setAddingSub(false)
    router.refresh()
  }

  function handleLinkClick() {
    if (links.length === 1) {
      openUrl(links[0])
    } else {
      togglePopup('links')
    }
  }

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f2f2f0] hover:bg-[#FAFAF8] group relative"
        style={{
          paddingLeft: 16 + lvl * 26,
          zIndex: openPopup ? 20 : 'auto',
          borderLeft: categoryObj ? '4px solid ' + categoryObj.color : '4px solid transparent',
        }}
        title={item.category || undefined}
      >
        {children.length > 0 ? (
          <button onClick={function () { setExpanded(function (e) { return !e }) }} className="text-[#999] flex-shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <button
          onClick={toggleItem}
          className={'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ' + (item.checked ? 'bg-[#16A35A] border-[#16A35A]' : 'border-[#ccc] hover:border-[#0f3d28]')}
        >
          {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>

        <span className={'flex-1 text-[13.5px] ' + (item.checked ? 'line-through text-[#aaa]' : 'text-[#222]')}>
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

          {item.due_date && (
            <span className="text-[10.5px] text-[#888] bg-[#f2f2f0] px-2 py-1 rounded-full whitespace-nowrap">
              {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {item.remarks && (
            <div className="relative">
              <button type="button" onClick={function () { togglePopup('remarks') }} className="text-[#B06800] hover:opacity-70" title="View remarks">
                <StickyNote size={13} />
              </button>
              {openPopup === 'remarks' && (
                <div>
                  <div className="fixed inset-0 z-[90]" onClick={function () { setOpenPopup(null) }} />
                  <div className="absolute right-0 top-6 w-56 bg-white border border-[#eee] rounded-lg shadow-lg p-3 z-[100]">
                    <div className="text-[10px] font-bold text-[#B06800] uppercase mb-1">Remarks</div>
                    <div className="text-xs text-[#333] whitespace-pre-wrap mb-2">{item.remarks}</div>
                    <button onClick={handleEditRemark} className="text-[10px] font-semibold text-[#0f3d28] hover:underline">Edit</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {links.length > 0 && (
            <div className="relative">
              <button type="button" onClick={handleLinkClick} className="text-[#888] hover:text-[#0f3d28]" title={links.length === 1 ? 'Open document' : links.length + ' document links'}>
                <Link2 size={13} />
              </button>
              {openPopup === 'links' && links.length > 1 && (
                <div>
                  <div className="fixed inset-0 z-[90]" onClick={function () { setOpenPopup(null) }} />
                  <div className="absolute right-0 top-6 w-64 bg-white border border-[#eee] rounded-lg shadow-lg p-2 z-[100]">
                    <div className="text-[10px] font-bold text-[#888] uppercase px-1 mb-1">Document Links</div>
                    {links.map(function (link, idx) {
                      return (
                        <button key={idx} type="button" onClick={function () { openUrl(link) }} className="block w-full text-left px-2 py-1.5 text-xs text-blue-600 hover:bg-[#F5FAF6] rounded-md truncate">
                          {link}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {item.priority && item.priority !== 'medium' && (
            <span className={'text-[10px] font-bold px-2 py-1 rounded-full ' + (item.priority === 'critical' ? 'bg-[#FDEAEA] text-[#C0282A]' : 'bg-[#FFF3DC] text-[#B06800]')}>
              {item.priority}
            </span>
          )}
          <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>

          {isAdmin && (
            <button onClick={function () { onEdit(item) }} className="text-[#999] hover:text-[#0f3d28] opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={14} />
            </button>
          )}

          {isAdmin && (
            <div className="relative">
              <button onClick={function () { togglePopup('menu') }} disabled={busy} className="text-[#999] hover:text-[#0f3d28] opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={14} />
              </button>
              {openPopup === 'menu' && (
                <div>
                  <div className="fixed inset-0 z-[90]" onClick={function () { setOpenPopup(null) }} />
                  <div className="absolute right-0 top-6 bg-white border border-[#eee] rounded-lg shadow-lg py-1 w-48 z-[100]">
                    <button onClick={function () { setOpenPopup(null); setAddingSub(true); setExpanded(true) }} className="w-full text-left px-3 py-1.5 text-xs text-[#204A2E] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <Plus size={12} /> Add sub-item
                    </button>
                    <button onClick={handleEditRemark} className="w-full text-left px-3 py-1.5 text-xs text-[#333] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <StickyNote size={12} /> Edit remark
                    </button>
                    <button onClick={function () { setOpenPopup(null); onEdit(item) }} className="w-full text-left px-3 py-1.5 text-xs text-[#333] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <Pencil size={12} /> Edit details
                    </button>
                    <button onClick={handleRename} className="w-full text-left px-3 py-1.5 text-xs text-[#333] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <Pencil size={12} /> Rename
                    </button>
                    <div className="border-t border-[#eee] my-1" />
                    <button onClick={function () { handleMove('up') }} disabled={busy} className="w-full text-left px-3 py-1.5 text-xs text-[#333] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <ArrowUp size={12} /> Move up
                    </button>
                    <button onClick={function () { handleMove('down') }} disabled={busy} className="w-full text-left px-3 py-1.5 text-xs text-[#333] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <ArrowDown size={12} /> Move down
                    </button>
                    <div className="border-t border-[#eee] my-1" />
                    <button onClick={function () { setStatus(true, 'completed') }} className="w-full text-left px-3 py-1.5 text-xs text-[#16A35A] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <Check size={12} /> Mark complied
                    </button>
                    <button onClick={function () { setStatus(false, 'not_started') }} className="w-full text-left px-3 py-1.5 text-xs text-[#B06800] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <X size={12} /> Mark not complied
                    </button>
                    <button onClick={function () { setStatus(false, 'na') }} className="w-full text-left px-3 py-1.5 text-xs text-[#6C6080] hover:bg-[#F5FAF6] flex items-center gap-1.5">
                      <Ban size={12} /> Mark N/A (exclude)
                    </button>
                    <div className="border-t border-[#eee] my-1" />
                    <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && children.map(function (child) {
        return <ItemRow key={child.id} item={child} onEdit={onEdit} level={lvl + 1} categories={cats} isAdmin={isAdmin} />
      })}

      {addingSub && (
        <div className="flex gap-2 px-4 py-2 bg-[#FAFAF8]" style={{ paddingLeft: 16 + (lvl + 1) * 26 }}>
          <input
            autoFocus
            placeholder="Sub-item name..."
            value={subLabel}
            onChange={function (e) { setSubLabel(e.target.value) }}
            onKeyDown={function (e) { if (e.key === 'Enter') submitSubItem() }}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-1.5 text-xs"
          />
          <button onClick={submitSubItem} disabled={busy} className="px-3 py-1.5 bg-[#0f3d28] text-white rounded-lg text-xs font-semibold">Add</button>
          <button onClick={function () { setAddingSub(false) }} className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs">Cancel</button>
        </div>
      )}
    </div>
  )
}