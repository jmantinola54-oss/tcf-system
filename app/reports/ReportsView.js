'use client'

import { useState, useMemo } from 'react'
import { BarChart3, AlertTriangle } from 'lucide-react'

function dayDiff(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / 86400000)
}

function analyze(branches) {
  let total = 0, done = 0
  const overdue = []
  const upcoming = []
  const categoryCounts = {}

  branches.forEach(branch => {
    (branch.pills || []).forEach(pill => {
      (pill.sections || []).forEach(section => {
        (section.checklist_items || []).forEach(item => {
          total++
          if (item.checked) done++

          const cat = item.category || 'Uncategorized'
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

          if (item.due_date && !item.checked) {
            const diff = dayDiff(item.due_date)
            const entry = { ...item, branchName: branch.name, pillName: pill.name, sectionLabel: section.label, diff }
            if (diff < 0) overdue.push(entry)
            else if (diff <= 7) upcoming.push(entry)
          }
        })
      })
    })
  })

  overdue.sort((a, b) => a.diff - b.diff)
  upcoming.sort((a, b) => a.diff - b.diff)

  return {
    total, done,
    pct: total ? Math.round((done / total) * 100) : 0,
    overdue, upcoming,
    categories: Object.entries(categoryCounts).sort(([, a], [, b]) => b - a),
  }
}

export default function ReportsView({ branches }) {
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'all')

  const scoped = selectedBranchId === 'all' ? branches : branches.filter(b => b.id === selectedBranchId)
  const report = useMemo(() => analyze(scoped), [scoped])
  const scopeName = selectedBranchId === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranchId)?.name

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-[#0f3d28]" />
          <h1 className="font-display text-2xl font-bold text-[#0f3d28] tracking-tight">Executive Report</h1>
        </div>
        <select
          value={selectedBranchId}
          onChange={e => setSelectedBranchId(e.target.value)}
          className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <p className="text-[#6E9A7C] text-sm mb-6">
        Snapshot for {scopeName} · generated {new Date().toLocaleString()}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Overall Completion</div>
          <div className="font-display text-3xl font-extrabold text-[#0A1F12]">{report.pct}%</div>
          <div className="text-xs text-[#888] mt-1">{report.done} of {report.total} items</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Items Complied</div>
          <div className="font-display text-3xl font-extrabold text-[#16A35A]">{report.done}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Overdue</div>
          <div className="font-display text-3xl font-extrabold" style={{ color: report.overdue.length ? '#C0282A' : '#0A1F12' }}>{report.overdue.length}</div>
          <div className="text-xs text-[#888] mt-1">{report.overdue.length ? 'Needs attention' : 'None'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
          <div className="text-[10.5px] font-bold text-[#6E9A7C] uppercase tracking-wider mb-2">Upcoming (7d)</div>
          <div className="font-display text-3xl font-extrabold text-[#0A1F12]">{report.upcoming.length}</div>
          <div className="text-xs text-[#888] mt-1">Due soon</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-5 mb-6">
        <h3 className="font-display font-bold text-[#0f3d28] mb-4">Completion by Category</h3>
        {report.categories.length === 0 ? (
          <p className="text-sm text-[#888]">No items yet.</p>
        ) : (
          <div className="space-y-2">
            {report.categories.map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-[#f2f2f0] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0f3d28]" />
                  <span className="text-sm text-[#333]">{cat}</span>
                </div>
                <span className="text-xs text-[#888]">{count} items</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-5 mb-6">
        <h3 className="font-display font-bold text-[#0f3d28] mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#C0282A]" /> Overdue Items
        </h3>
        {report.overdue.length === 0 ? (
          <p className="text-sm text-[#888]">Nothing to show.</p>
        ) : (
          <div className="space-y-2">
            {report.overdue.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#f2f2f0] last:border-0">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[11px] text-[#999]">{item.branchName} / {item.pillName} / {item.sectionLabel}</div>
                </div>
                <span className="text-xs font-bold text-[#C0282A]">{Math.abs(item.diff)}d overdue</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-5">
        <h3 className="font-display font-bold text-[#0f3d28] mb-4">Upcoming Deadlines</h3>
        {report.upcoming.length === 0 ? (
          <p className="text-sm text-[#888]">Nothing to show.</p>
        ) : (
          <div className="space-y-2">
            {report.upcoming.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#f2f2f0] last:border-0">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[11px] text-[#999]">{item.branchName} / {item.pillName} / {item.sectionLabel}</div>
                </div>
                <span className="text-xs font-bold text-[#B06800]">{item.diff === 0 ? 'Today' : `${item.diff}d left`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}