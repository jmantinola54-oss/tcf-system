'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, MoreVertical, Link2, Trash2 } from 'lucide-react'
import { logActivity } from '../../../lib/audit'

const STATUS_STYLE = {
  not_started: { bg: '#F0EAF0', color: '#6C6080', label: 'Not Started' },
  in_progress: { bg: '#FFF3DC', color: '#B06800', label: 'In Progress' },
  pending_review: { bg: '#E9F5EC', color: '#204A2E', label: 'Pending Review' },
  completed: { bg: '#E1F7EC', color: '#16A35A', label: 'Completed' },
  overdue: { bg: '#FDEAEA', color: '#C0282A', label: 'Overdue' },
  na: { bg: '#F0EAF0', color: '#6C6080', label: 'N/A' },
}

export default function ItemRow({ item, onEdit }) {
  const supabase = createClient()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started

  async function toggleItem() {
    const { error } = await supabase.from('checklist_items').update({ checked: !item.checked }).eq('id', item.id)
    if (error) { alert("Couldn't update — you may not have permission.\n\n" + error.message); return }
    await logActivity(supabase, item.checked ? 'item_unchecked' : 'item_checked', { label: item.label })
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.label}"?`)) return
    const { error } = await supabase.from('checklist_items').delete().eq('id', item.id)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'item_deleted', { label: item.label })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f2f2f0] hover:bg-[#FAFAF8] group">
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
        {item.category && (
          <span className="w-6 h-6 rounded-full bg-[#0f3d28] text-white text-[10px] font-bold flex items-center justify-center" title={item.category}>
            {item.category.slice(0, 2).toUpperCase()}
          </span>
        )}
        {item.due_date && (
          <span className="text-[10.5px] text-[#888] bg-[#f2f2f0] px-2 py-1 rounded-full whitespace-nowrap">
            {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {item.doc_links?.length > 0 && <Link2 size={13} className="text-[#888]" />}
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
            <div className="absolute right-0 top-6 bg-white border border-[#eee] rounded-lg shadow-lg py-1 w-32 z-10">
              <button
                onClick={() => { setMenuOpen(false); handleDelete() }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}