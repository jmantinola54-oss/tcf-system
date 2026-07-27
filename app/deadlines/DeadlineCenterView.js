'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react'

function dayDiff(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

function bucketFor(item) {
  if (item.checked) return 'completed'
  const diff = dayDiff(item.due_date)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 7) return 'week'
  return 'upcoming'
}

const BUCKETS = [
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: '#C0282A', bg: '#FDEAEA' },
  { key: 'today', label: 'Due Today', icon: Clock, color: '#B06800', bg: '#FFF3DC' },
  { key: 'week', label: 'Due This Week', icon: CalendarDays, color: '#204A2E', bg: '#E9F5EC' },
  { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, color: '#6E9A7C', bg: '#F5FAF6' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: '#16A35A', bg: '#E1F7EC' },
]

export default function DeadlineCenterView({ items }) {
  const [filter, setFilter] = useState('active')

  const grouped = BUCKETS.map(b => ({
    ...b,
    items: items.filter(i => bucketFor(i) === b.key),
  }))

  const visibleGroups = filter === 'active' ? grouped.filter(g => g.key !== 'completed') : grouped

  const counts = {
    overdue: grouped.find(g => g.key === 'overdue').items.length,
    today: grouped.find(g => g.key === 'today').items.length,
  }

  return (
    <div>
      {(counts.overdue > 0 || counts.today > 0) && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {counts.overdue > 0 && (
            <div className="flex items-center gap-2 bg-[#FDEAEA] text-[#C0282A] px-4 py-2 rounded-xl text-sm font-semibold">
              <AlertTriangle size={15} /> {counts.overdue} overdue item{counts.overdue === 1 ? '' : 's'}
            </div>
          )}
          {counts.today > 0 && (
            <div className="flex items-center gap-2 bg-[#FFF3DC] text-[#B06800] px-4 py-2 rounded-xl text-sm font-semibold">
              <Clock size={15} /> {counts.today} due today
            </div>
          )}
        </div>
      )}

      <div className="flex bg-[#F0EAF0] rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'active' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}
        >
          Include Completed
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">
          No items have due dates set yet.
        </div>
      )}

      <div className="space-y-6">
        {visibleGroups.map(group => {
          if (group.items.length === 0) return null
          const Icon = group.icon
          return (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-2.5">
                <Icon size={15} style={{ color: group.color }} />
                <h3 className="font-semibold text-sm" style={{ color: group.color }}>{group.label}</h3>
                <span className="text-xs text-[#999]">({group.items.length})</span>
              </div>
              <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
                {group.items.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={`/checklist/pill/${item.sections?.pill_id}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8] ${idx !== group.items.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13.5px] ${item.checked ? 'line-through text-[#aaa]' : 'text-[#222]'}`}>{item.label}</div>
                      <div className="text-[11px] text-[#999] mt-0.5">
                        {item.sections?.pills?.branches?.name} / {item.sections?.pills?.name} / {item.sections?.label}
                      </div>
                    </div>
                    {item.category && (
                      <span className="text-[10px] bg-[#f2f2f0] text-[#666] px-2 py-1 rounded-full whitespace-nowrap">{item.category}</span>
                    )}
                    {item.priority && item.priority !== 'medium' && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.priority === 'critical' ? 'bg-[#FDEAEA] text-[#C0282A]' : 'bg-[#FFF3DC] text-[#B06800]'}`}>
                        {item.priority}
                      </span>
                    )}
                    <span className="text-xs text-[#666] whitespace-nowrap" style={{ background: group.bg, color: group.color, padding: '4px 10px', borderRadius: 999 }}>
                      {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <ArrowRight size={14} className="text-[#ccc] flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}