'use client'

import { useState } from 'react'
import { CheckSquare, Plus, Trash2, Pencil, Network, ClipboardList, Package, User } from 'lucide-react'

const ACTION_META = {
  item_checked: { icon: CheckSquare, label: 'Checked an item', color: '#16A35A' },
  item_unchecked: { icon: CheckSquare, label: 'Unchecked an item', color: '#B06800' },
  item_added: { icon: Plus, label: 'Added an item', color: '#16A35A' },
  item_deleted: { icon: Trash2, label: 'Deleted an item', color: '#C0282A' },
  item_edited: { icon: Pencil, label: 'Edited item details', color: '#204A2E' },
  section_added: { icon: Plus, label: 'Added a section', color: '#16A35A' },
  section_renamed: { icon: Pencil, label: 'Renamed a section', color: '#204A2E' },
  section_deleted: { icon: Trash2, label: 'Deleted a section', color: '#C0282A' },
  branch_added: { icon: Network, label: 'Added a branch', color: '#16A35A' },
  branch_renamed: { icon: Pencil, label: 'Renamed a branch', color: '#204A2E' },
  branch_deleted: { icon: Trash2, label: 'Deleted a branch', color: '#C0282A' },
  task_created: { icon: ClipboardList, label: 'Created & assigned a task', color: '#16A35A' },
  inventory_added: { icon: Package, label: 'Added inventory item', color: '#16A35A' },
  inventory_withdraw: { icon: Package, label: 'Withdrew stock', color: '#B06800' },
  inventory_restock: { icon: Package, label: 'Restocked', color: '#16A35A' },
  inventory_deleted: { icon: Trash2, label: 'Deleted inventory item', color: '#C0282A' },
  user_approved: { icon: User, label: 'Approved a user', color: '#16A35A' },
  user_status_changed: { icon: User, label: 'Changed a user\'s status', color: '#204A2E' },
}

function describe(log) {
  const meta = ACTION_META[log.action] || { icon: Pencil, label: log.action, color: '#6C6080' }
  const name = log.details?.name || log.details?.label || log.details?.item_name || ''
  return { ...meta, name }
}

export default function ActivityLogView({ logs }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action.startsWith(filter))

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'item', label: 'Checklist' },
    { key: 'branch', label: 'Branches' },
    { key: 'task', label: 'Tasks' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'user', label: 'Users' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              filter === f.key ? 'bg-[#0f3d28] text-white border-[#0f3d28]' : 'border-[#ddd] text-[#666] hover:bg-[#f5f5f5]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-[#888] text-sm">No activity recorded yet.</div>
        )}
        {filtered.map((log, idx) => {
          const { icon: Icon, label, color, name } = describe(log)
          return (
            <div key={log.id} className={`flex items-start gap-3 px-4 py-3 ${idx !== filtered.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '1a' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#222]">
                  <span className="font-semibold">{log.profiles?.full_name || log.profiles?.email || 'Someone'}</span>
                  {' '}{label.toLowerCase()}
                  {name && <span className="text-[#666]"> — "{name}"</span>}
                </div>
                <div className="text-[11px] text-[#999] mt-0.5">
                  {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}