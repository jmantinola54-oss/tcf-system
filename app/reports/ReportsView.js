'use client'

import { useState, useMemo } from 'react'
import { FileDown, FileText, Network } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function flattenItems(branches) {
  const rows = []
  branches.forEach(branch => {
    (branch.pills || []).forEach(pill => {
      (pill.sections || []).forEach(section => {
        (section.checklist_items || []).forEach(item => {
          rows.push({
            branch: branch.name,
            pill: pill.name,
            section: section.label,
            item: item.label,
            category: item.category || '',
            priority: item.priority || 'medium',
            status: item.item_status || 'not_started',
            dueDate: item.due_date || '',
            checked: item.checked ? 'Yes' : 'No',
          })
        })
      })
    })
  })
  return rows
}

function branchSummary(branches) {
  return branches.map(branch => {
    let total = 0, done = 0
    ;(branch.pills || []).forEach(pill => {
      (pill.sections || []).forEach(section => {
        (section.checklist_items || []).forEach(item => {
          total++
          if (item.checked) done++
        })
      })
    })
    return { name: branch.name, total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  })
}

export default function ReportsView({ branches }) {
  const [busy, setBusy] = useState(false)
  const rows = useMemo(() => flattenItems(branches), [branches])
  const summary = useMemo(() => branchSummary(branches), [branches])

  function exportCSV() {
    setBusy(true)
    const headers = ['Branch', 'Pill', 'Section', 'Item', 'Category', 'Priority', 'Status', 'Due Date', 'Checked']
    const csvRows = [headers.join(',')]
    rows.forEach(r => {
      const line = [r.branch, r.pill, r.section, r.item, r.category, r.priority, r.status, r.dueDate, r.checked]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
      csvRows.push(line)
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tcf-checklist-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setBusy(false)
  }

  function exportPDF() {
    setBusy(true)
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(16)
    doc.text('TCF Production Checklist — Report', 14, 15)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 21)

    autoTable(doc, {
      startY: 28,
      head: [['Branch', 'Complied', 'Total', '%']],
      body: summary.map(s => [s.name, s.done, s.total, `${s.pct}%`]),
      theme: 'grid',
      headStyles: { fillColor: [15, 61, 40] },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Branch', 'Pill', 'Section', 'Item', 'Category', 'Priority', 'Status', 'Due Date', 'Checked']],
      body: rows.map(r => [r.branch, r.pill, r.section, r.item, r.category, r.priority, r.status, r.dueDate, r.checked]),
      theme: 'striped',
      headStyles: { fillColor: [15, 61, 40] },
      styles: { fontSize: 7 },
    })

    doc.save(`tcf-checklist-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    setBusy(false)
  }

  return (
    <div>
      <div className="flex gap-3 mb-8">
        <button
          onClick={exportCSV}
          disabled={busy || rows.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm font-semibold text-[#0f3d28] hover:bg-[#F5FAF6] disabled:opacity-40"
        >
          <FileDown size={15} /> Export CSV
        </button>
        <button
          onClick={exportPDF}
          disabled={busy || rows.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold hover:bg-[#14512f] disabled:opacity-40"
        >
          <FileText size={15} /> Export PDF
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Network size={16} className="text-[#0f3d28]" />
        <h2 className="font-display text-base font-bold text-[#0f3d28]">Branch Summary</h2>
      </div>

      {summary.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">
          No data to report yet.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        {summary.map((s, idx) => (
          <div key={s.name} className={`flex items-center gap-4 px-5 py-3.5 ${idx !== summary.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}>
            <span className="flex-1 font-semibold text-[13.5px] text-[#222]">{s.name}</span>
            <span className="text-xs text-[#888] whitespace-nowrap">{s.done}/{s.total} complied</span>
            <div className="w-32 bg-[#eee] rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[#16A35A] rounded-full" style={{ width: `${s.pct}%` }} />
            </div>
            <span className="font-bold text-sm text-[#0A1F12] w-10 text-right">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}