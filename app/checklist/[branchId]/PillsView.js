'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { logActivity } from '../../lib/audit'

function pillProgress(pill) {
  let total = 0, done = 0
  const sections = pill.sections || []
  sections.forEach(function (sec) {
    const items = sec.checklist_items || []
    items.forEach(function (item) {
      if (item.parent_id) return
      total++
      if (item.checked) done++
    })
  })
  return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 }
}

export default function PillsView({ branchId, initialPills, isAdmin }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const pills = initialPills

  async function handleAddPill() {
    const name = prompt('New pill name (e.g. Media, Tech, Program):')
    if (!name || !name.trim()) return
    setBusy(true)
    const res = await supabase.from('pills').insert({ branch_id: branchId, name: name.trim(), sort_order: pills.length })
    setBusy(false)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'pill_added', { name: name.trim() })
    router.refresh()
  }

  async function handleRename(pill) {
    const name = prompt('Rename pill:', pill.name)
    if (!name || !name.trim() || name.trim() === pill.name) return
    setBusy(true)
    const res = await supabase.from('pills').update({ name: name.trim() }).eq('id', pill.id)
    setBusy(false)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'pill_renamed', { name: name.trim() })
    router.refresh()
  }

  async function handleDelete(pill) {
    if (!confirm('Delete "' + pill.name + '" and everything inside it?')) return
    setBusy(true)
    const res = await supabase.from('pills').delete().eq('id', pill.id)
    setBusy(false)
    if (res.error) { alert('Error: ' + res.error.message); return }
    await logActivity(supabase, 'pill_deleted', { name: pill.name })
    router.refresh()
  }

  async function handleReorder(pill, direction) {
    const idx = pills.findIndex(function (p) { return p.id === pill.id })
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pills.length) return
    const other = pills[swapIdx]
    setBusy(true)
    await supabase.from('pills').update({ sort_order: other.sort_order != null ? other.sort_order : swapIdx }).eq('id', pill.id)
    await supabase.from('pills').update({ sort_order: pill.sort_order != null ? pill.sort_order : idx }).eq('id', other.id)
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#0f3d28]" />
          <h2 className="font-display text-lg font-bold text-[#0f3d28]">Pills</h2>
        </div>
        {isAdmin && (
          <button onClick={handleAddPill} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus size={15} /> Add Pill
          </button>
        )}
      </div>

      {pills.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">
          No pills yet.{isAdmin ? ' Click "Add Pill" to create one, like Media, Tech, or Program.' : ''}
        </div>
      )}

      <div className="grid gap-4">
        {pills.map(function (pill, idx) {
          const stats = pillProgress(pill)
          return (
            <div key={pill.id} className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
              <a href={'/checklist/pill/' + pill.id} className="block p-5 hover:bg-[#FAFAF8]">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[#0A1F12] text-[15px]">{pill.name}</span>
                  <span className="font-display text-xl font-extrabold text-[#0A1F12]">{stats.pct}%</span>
                </div>
                <div className="text-xs text-[#888] my-2">{stats.done} / {stats.total} complied</div>
                <div className="bg-[#eee] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#16A35A]" style={{ width: stats.pct + '%' }} />
                </div>
              </a>
              {isAdmin && (
                <div className="flex items-center justify-end gap-1.5 px-5 py-2.5 border-t border-[#f0f0ee] bg-[#FAFAF8]">
                  <button onClick={function () { handleReorder(pill, 'up') }} disabled={busy || idx === 0} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0] disabled:opacity-30"><ArrowUp size={13} /></button>
                  <button onClick={function () { handleReorder(pill, 'down') }} disabled={busy || idx === pills.length - 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0] disabled:opacity-30"><ArrowDown size={13} /></button>
                  <button onClick={function () { handleRename(pill) }} disabled={busy} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0]"><Pencil size={13} /></button>
                  <button onClick={function () { handleDelete(pill) }} disabled={busy} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-red-50 text-red-600"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}