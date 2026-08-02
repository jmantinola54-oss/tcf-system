'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, FileDown, FileText, Link2, Pencil } from 'lucide-react'

const STATUS_STYLE = {
  not_started: { bg: '#F0EAF0', color: '#6C6080', label: 'Not Started' },
  in_progress: { bg: '#FFF3DC', color: '#B06800', label: 'In Progress' },
  pending_review: { bg: '#E9F5EC', color: '#204A2E', label: 'Pending Review' },
  completed: { bg: '#E1F7EC', color: '#16A35A', label: 'Completed' },
  overdue: { bg: '#FDEAEA', color: '#C0282A', label: 'Overdue' },
  na: { bg: '#F0EAF0', color: '#6C6080', label: 'N/A' },
}

function dayDiff(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / 86400000)
}

function daysLeftLabel(item) {
  if (item.checked) return 'done'
  const diff = dayDiff(item.due_date)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'today'
  return `${diff}d left`
}

function bucketFor(item) {
  if (item.checked) return 'completed'
  const diff = dayDiff(item.due_date)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 7) return 'week'
  if (diff <= 31) return 'month'
  return 'later'
}

function daysLeftStyle(item) {
  const bucket = bucketFor(item)
  if (bucket === 'completed') return { bg: '#E1F7EC', color: '#16A35A' }
  if (bucket === 'overdue') return { bg: '#FDEAEA', color: '#C0282A' }
  if (bucket === 'today' || bucket === 'week') return { bg: '#FFF3DC', color: '#B06800' }
  return { bg: '#EEF2EF', color: '#5C6B62' }
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'completed', label: 'Completed' },
]

export default function DeadlineCenterView({ items }) {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const categories = useMemo(
    () => [...new Set(items.map(i => i.category).filter(Boolean))].sort(),
    [items]
  )

  const filtered = items.filter(item => {
    const bucket = bucketFor(item)
    if (tab !== 'all' && bucket !== tab) return false
    if (category && item.category !== category) return false
    if (search && !item.label.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function exportCSV() {
    const headers = ['Task', 'Category', 'Status', 'Due Date', 'Days Left', 'Branch', 'Pill', 'Section']
    const rows = [headers.join(',')]
    filtered.forEach(item => {
      const line = [
        item.label, item.category || '', item.item_status || 'not_started', item.due_date,
        daysLeftLabel(item), item.sections?.pills?.branches?.name || '', item.sections?.pills?.name || '', item.sections?.label || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      rows.push(line)
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tcf-deadlines-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text('TCF Deadline Center', 14, 15)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 21)
    autoTable(doc, {
      startY: 28,
      head: [['Task', 'Category', 'Status', 'Due Date', 'Days Left', 'Branch / Pill / Section']],
      body: filtered.map(item => [
        item.label, item.category || '—', (STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started).label,
        item.due_date, daysLeftLabel(item),
        `${item.sections?.pills?.branches?.name || ''} / ${item.sections?.pills?.name || ''} / ${item.sections?.label || ''}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 61, 40] },
      styles: { fontSize: 8 },
    })
    doc.save(`tcf-deadlines-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.key ? 'bg-[#0f3d28] text-white shadow-sm' : 'bg-white border border-[#ddd] text-[#555] hover:bg-[#f5f5f5]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa]" />
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#ddd] text-sm" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="border border-[#ddd] rounded-lg px-3 py-2 text-sm">
          <option value="">Filter by category…</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#ddd] rounded-lg text-xs font-semibold text-[#0f3d28] hover:bg-[#F5FAF6] transition-colors">
          <FileDown size={13} /> Excel (CSV)
        </button>
        <button onClick={exportPDF} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-lg text-xs font-semibold transition-colors">
          <FileText size={13} /> PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left border-b border-[#eee] bg-[#FAFAF8]">
                <th className="p-3 text-xs text-[#888]">Task</th>
                <th className="p-3 text-xs text-[#888]">Category</th>
                <th className="p-3 text-xs text-[#888]">Status</th>
                <th className="p-3 text-xs text-[#888]">Deadline</th>
                <th className="p-3 text-xs text-[#888]">Days Left</th>
                <th className="p-3 text-xs text-[#888]">Doc</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-[#888]">No tasks match this view.</td></tr>
              )}
              {filtered.map(item => {
                const status = STATUS_STYLE[item.item_status] || STATUS_STYLE.not_started
                return (
                  <tr key={item.id} className="border-b border-[#f2f2f0] hover:bg-[#FAFAF8]">
                    <td className="p-3">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[11px] text-[#999]">{item.sections?.pills?.branches?.name} / {item.sections?.pills?.name} / {item.sections?.label}</div>
                    </td>
                    <td className="p-3">
                      {item.category ? (
                        <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-[#EEF2EF] text-[#5C6B62]">{item.category}</span>
                      ) : (
                        <span className="text-[#bbb]">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    </td>
                    <td className="p-3 text-[#666]">{item.due_date}</td>
                    <td className="p-3">
                      {(function () {
                        const dl = daysLeftStyle(item)
                        return <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: dl.bg, color: dl.color }}>{daysLeftLabel(item)}</span>
                      })()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.doc_links?.length > 0 && <Link2 size={14} className="text-[#888]" />}
                        <Link href={`/checklist/pill/${item.sections?.pill_id}`} className="text-[#0f3d28]">
                          <Pencil size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}