'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Link2, StickyNote, ArrowRight, Check, PartyPopper } from 'lucide-react'
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

export default function TasksView({ tasks, isAdmin }) {
  const supabase = createClient()
  const router = useRouter()
  const [filter, setFilter] = useState('active')
  const [editingItem, setEditingItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [showRemarksId, setShowRemarksId] = useState(null)
  const [showLinksId, setShowLinksId] = useState(null)

  const loadCategories = useCallback(async function () {
    const res = await supabase.from('checklist_categories').select('*').order('name')
    setCategories(res.data || [])
  }, [])

  useEffect(function () { loadCategories() }, [loadCategories])

  const visible = filter === 'active' ? tasks.filter(function (t) { return !t.checked }) : tasks

  async function toggleItem(item) {
    const res = await supabase.from('checklist_items').update({ checked: !item.checked }).eq('id', item.id)
    if (res.error) { alert("Could not update.\n\n" + res.error.message); return }
    await logActivity(supabase, item.checked ? 'item_unchecked' : 'item_checked', { label: item.label })
    router.refresh()
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e5e0] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E1F7EC] flex items-center justify-center mx-auto mb-4">
          <PartyPopper size={22} className="text-[#16A35A]" strokeWidth={2} />
        </div>
        <p className="text-sm text-[#666] font-medium">No tasks assigned to you yet.</p>
        <p className="text-xs text-[#999] mt-1">Once an admin assigns you something, it'll show up here.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex bg-[#EEF2EF] rounded-lg p-1 w-fit mb-5">
        <button onClick={function () { setFilter('active') }} className={'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ' + (filter === 'active' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#5C6B62]')}>Active</button>
        <button onClick={function () { setFilter('all') }} className={'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ' + (filter === 'all' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#5C6B62]')}>All</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        {visible.length === 0 && <div className="p-10 text-center text-[#888] text-sm">Nothing active right now.</div>}
        {visible.map(function (item, idx) {
          const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started
          const catObj = categories.find(function (c) { return c.name === item.category })
          return (
            <div key={item.id} className={'flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8] flex-wrap ' + (idx !== visible.length - 1 ? 'border-b border-[#f2f2f0]' : '')}>
              <button
                onClick={function () { toggleItem(item) }}
                className={'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ' + (item.checked ? 'bg-[#16A35A] border-[#16A35A]' : 'border-[#ccc] hover:border-[#0f3d28]')}
              >
                {item.checked && <Check size={12} strokeWidth={3} className="text-white" />}
              </button>

              <div className="flex-1 min-w-[140px]">
                <div className={'text-[13.5px] ' + (item.checked ? 'line-through text-[#aaa]' : 'text-[#222]')}>{item.label}</div>
                <div className="text-[11px] text-[#999] mt-0.5">
                  {item.sections && item.sections.pills && item.sections.pills.branches ? item.sections.pills.branches.name : ''} / {item.sections && item.sections.pills ? item.sections.pills.name : ''} / {item.sections ? item.sections.label : ''}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.category && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white whitespace-nowrap" style={{ background: catObj ? catObj.color : '#0f3d28' }}>
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
                    <button type="button" onClick={function () { setShowRemarksId(showRemarksId === item.id ? null : item.id); setShowLinksId(null) }} className="text-[#B06800] hover:opacity-70">
                      <StickyNote size={13} />
                    </button>
                    {showRemarksId === item.id && (
                      <div>
                        <div className="fixed inset-0 z-[90]" onClick={function () { setShowRemarksId(null) }} />
                        <div className="absolute right-0 top-6 w-56 bg-white border border-[#eee] rounded-lg shadow-lg p-3 z-[100]">
                          <div className="text-[10px] font-bold text-[#B06800] uppercase mb-1">Remarks</div>
                          <div className="text-xs text-[#333] whitespace-pre-wrap">{item.remarks}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {item.doc_links && item.doc_links.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={function () {
                        if (item.doc_links.length === 1) {
                          window.open(item.doc_links[0], '_blank', 'noreferrer')
                        } else {
                          setShowLinksId(showLinksId === item.id ? null : item.id)
                          setShowRemarksId(null)
                        }
                      }}
                      className="text-[#888] hover:text-[#0f3d28]"
                    >
                      <Link2 size={13} />
                    </button>
                    {showLinksId === item.id && item.doc_links.length > 1 && (
                      <div>
                        <div className="fixed inset-0 z-[90]" onClick={function () { setShowLinksId(null) }} />
                        <div className="absolute right-0 top-6 w-64 bg-white border border-[#eee] rounded-lg shadow-lg p-2 z-[100]">
                          <div className="text-[10px] font-bold text-[#888] uppercase px-1 mb-1">Document Links</div>
                          {item.doc_links.map(function (link, i) {
                            return (
                              <button key={i} type="button" onClick={function () { window.open(link, '_blank', 'noreferrer') }} className="block w-full text-left px-2 py-1.5 text-xs text-blue-600 hover:bg-[#F5FAF6] rounded-md truncate">
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
                  <span className={'text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ' + (item.priority === 'critical' ? 'bg-[#FDEAEA] text-[#C0282A]' : 'bg-[#FFF3DC] text-[#B06800]')}>{item.priority}</span>
                )}
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                <button onClick={function () { setEditingItem(item) }} className="text-[#999] hover:text-[#0f3d28]" title="Update status, remarks, links"><Pencil size={14} /></button>
                <Link href={'/checklist/pill/' + (item.sections ? item.sections.pill_id : '')} className="text-[#999] hover:text-[#0f3d28]"><ArrowRight size={14} /></Link>
              </div>
            </div>
          )
        })}
      </div>

      {editingItem && (
        <ItemDetailsModal item={editingItem} categories={categories} isAdmin={isAdmin} onCategoriesChange={loadCategories} onClose={function () { setEditingItem(null) }} />
      )}
    </div>
  )
}