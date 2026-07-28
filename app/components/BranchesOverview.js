'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Network, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowRight, Search } from 'lucide-react'
import { logActivity } from '../lib/audit'

function branchStats(branch) {
  let total = 0, done = 0, pillCount = branch.pills?.length || 0
  branch.pills?.forEach(pill => {
    pill.sections?.forEach(section => {
      section.checklist_items?.forEach(item => {
        if (item.parent_id) return // sub-items don't count toward branch totals
        total++
        if (item.checked) done++
      })
    })
  })
  const pct = total ? Math.round((done / total) * 100) : 0
  return { total, done, pillCount, pct }
}

function statusBadge(pct) {
  if (pct >= 90) return { label: 'Completed', bg: '#E1F7EC', color: '#16A35A' }
  if (pct >= 50) return { label: 'On Track', bg: '#FFF3DC', color: '#B06800' }
  return { label: 'Behind Schedule', bg: '#FDEAEA', color: '#C0282A' }
}

export default function BranchesOverview({ initialBranches, isAdmin }) {
  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const branches = initialBranches
  const filtered = branches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))

  const totals = branches.reduce((acc, b) => {
    const s = branchStats(b)
    acc.total += s.total
    acc.done += s.done
    acc.pills += s.pillCount
    return acc
  }, { total: 0, done: 0, pills: 0 })
  const overallPct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0

  async function handleAddBranch() {
    const name = prompt('New branch name:')
    if (!name || !name.trim()) return
    setBusy(true)
    const { error } = await supabase.from('branches').insert({ name: name.trim(), sort_order: branches.length })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'branch_added', { name: name.trim() })
    router.refresh()
  }

  async function handleRename(branch) {
    const name = prompt('Rename branch:', branch.name)
    if (!name || !name.trim() || name.trim() === branch.name) return
    setBusy(true)
    const { error } = await supabase.from('branches').update({ name: name.trim() }).eq('id', branch.id)
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'branch_renamed', { name: name.trim() })
    router.refresh()
  }

  async function handleDelete(branch) {
    if (!confirm(`Delete "${branch.name}" and everything inside it? This cannot be undone.`)) return
    setBusy(true)
    const { error } = await supabase.from('branches').delete().eq('id', branch.id)
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'branch_deleted', { name: branch.name })
    router.refresh()
  }

  async function handleReorder(branch, direction) {
    const idx = branches.findIndex(b => b.id === branch.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= branches.length) return
    const other = branches[swapIdx]

    setBusy(true)
    await supabase.from('branches').update({ sort_order: other.sort_order ?? swapIdx }).eq('id', branch.id)
    await supabase.from('branches').update({ sort_order: branch.sort_order ?? idx }).eq('id', other.id)
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Overall Percentage</div>
          <div className="font-display text-3xl font-extrabold text-[#0A1F12]">{overallPct}%</div>
          <div className="text-xs text-[#6E9A7C] mb-2">{totals.done}/{totals.total}</div>
          <div className="bg-[#eee] rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg,#e87090,#ff9ab8)' }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">All Pills</div>
          <div className="font-display text-3xl font-extrabold text-[#0A1F12]">{totals.pills}</div>
          <div className="text-xs text-[#6E9A7C]">Tracked</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Tasks Complied</div>
          <div className="font-display text-3xl font-extrabold text-[#0A1F12]">{totals.done}</div>
          <div className="text-xs text-[#6E9A7C]">of {totals.total}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-[#0f3d28]" />
          <h2 className="font-display text-lg font-bold text-[#0f3d28]">All Branches</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa]" />
            <input
              placeholder="Search branches…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg border border-[#ddd] text-sm w-48 focus:outline-none focus:border-[#0f3d28]"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddBranch}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={15} /> Add Branch
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">
          No branches yet.
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((branch, idx) => {
          const { total, done, pillCount, pct } = branchStats(branch)
          const badge = statusBadge(pct)
          return (
            <div key={branch.id} className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fce8ef' }}>
                      <Network size={18} className="text-[#0f3d28]" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-[#0A1F12] text-[15px]">{branch.name}</div>
                      <div className="text-xs text-[#888]">{pillCount} pill{pillCount === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                  <a href={`/checklist/${branch.id}`}>
                    <ArrowRight size={16} className="text-[#888]" />
                  </a>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-2xl font-extrabold text-[#0A1F12]">{pct}%</span>
                  <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label.toUpperCase()}
                  </span>
                </div>
                <div className="bg-[#eee] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0f3d28]" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0f0ee] bg-[#FAFAF8]">
                <span className="text-xs text-[#666]"><strong className="text-[#0A1F12]">{done}</strong> / {total} complied</span>
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <>
                      <button onClick={() => handleReorder(branch, 'up')} disabled={busy || idx === 0} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0] disabled:opacity-30">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => handleReorder(branch, 'down')} disabled={busy || idx === filtered.length - 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0] disabled:opacity-30">
                        <ArrowDown size={13} />
                      </button>
                      <button onClick={() => handleRename(branch)} disabled={busy} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-[#f0f0f0]">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(branch)} disabled={busy} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] hover:bg-red-50 text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  <a href={`/checklist/${branch.id}`} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-lg text-xs font-semibold ml-1">
                    Open <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}