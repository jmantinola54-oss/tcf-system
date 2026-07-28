'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Link2, StickyNote, ArrowRight } from 'lucide-react'
import ItemDetailsModal from '../components/ItemDetailsModal'
import { logActivity } from '../lib/audit'

const STATUS_STYLE = {
  not_started: { bg: '#F0EAF0', color: '#6C6080', label: 'Not Started' },
  in_progress: { bg: '#FFF3DC', color: '#B06800', label: 'In Progress' },
  pending_review: { bg: '#E9F5EC', color: '#204A2E', label: 'Pending Review' },
  completed: { bg: '#E1F7EC', color: '#16A35A', label: 'Completed' },
  overdue: { bg: '#FDEAEA', color: '#C0282A', label: 'Overdue' },
  na: { bg: '#F0EAF0', color: '#6C6080', label: 'N/A' },
}

export default function TasksView({ tasks }) {
  const supabase = createClient()
  const router = useRouter()
  const [filter, setFilter] = useState('active')
  const [editingItem, setEditingItem] = useState(null)

  const visible = filter === 'active' ? tasks.filter(t => !t.checked) : tasks

  async function toggleItem(item) {
    const { error } = await supabase.from('checklist_items').update({ checked: !item.checked }).eq('id', item.id)
    if (error) { alert("Couldn't update.\n\n" + error.message); return }
    await logActivity(supabase, item.checked ? 'item_unchecked' : 'item_checked', { label: item.label })
    router.refresh()
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e5e0] p-12 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-sm text-[#666] font-medium">No tasks assigned to you yet.</p>
        <p className="text-xs text-[#999] mt-1">Once an admin assigns you something, it'll show up here.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex bg-[#F0EAF0] rounded-lg p-1 w-fit mb-5">
        <button onClick={() => setFilter('active')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'active' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>Active</button>
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>All</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        {visible.length === 0 && <div className="p-10 text-center text-[#888] text-sm">Nothing active right now.</div>}
        {visible.map((item, idx) => {
          const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started
          return (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8] ${idx !== visible.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}>
              <button
                onClick={() => toggleItem(item)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.checked ? 'bg-[#16A35A] border-[#16A35A]' : 'border-[#ccc] hover:border-[#0f3d28]'}`}
              >
                {item.checked && <span className="text-white text-[11px] leading-none">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div className={`text-[13.5px] ${item.checked ? 'line-through text-[#aaa]' : 'text-[#222]'}`}>{item.label}</div>
                <div className="text-[11px] text-[#999] mt-0.5">
                  {item.sections?.pills?.branches?.name} / {item.sections?.pills?.name} / {item.sections?.label}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.category && <span className="text-[10px] bg-[#f2f2f0] text-[#666] px-2 py-1 rounded-full whitespace-nowrap">{item.category}</span>}
                {item.due_date && (
                  <span className="text-[10.5px] text-[#888] bg-[#f2f2f0] px-2 py-1 rounded-full whitespace-nowrap">
                    {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {item.remarks && <StickyNote size={13} className="text-[#B06800]" />}
                {item.doc_links?.length > 0 && <Link2 size={13} className="text-[#888]" />}
                {item.priority && item.priority !== 'medium' && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.priority === 'critical' ? 'bg-[#FDEAEA] text-[#C0282A]' : 'bg-[#FFF3DC] text-[#B06800]'}`}>{item.priority}</span>
                )}
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                <button onClick={() => setEditingItem(item)} className="text-[#999] hover:text-[#0f3d28]"><Pencil size={14} /></button>
                <Link href={`/checklist/pill/${item.sections?.pill_id}`} className="text-[#999] hover:text-[#0f3d28]"><ArrowRight size={14} /></Link>
              </div>
            </div>
          )
        })}
      </div>

      {editingItem && <ItemDetailsModal item={editingItem} onClose={() => setEditingItem(null)} />}
    </div>
  )
}
