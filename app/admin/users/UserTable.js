'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '../../lib/audit'
import { Search, Check, X, Ban, RotateCcw, Trash2 } from 'lucide-react'

const STATUS_STYLE = {
  pending: { bg: '#FFF3DC', color: '#B06800', label: 'Pending' },
  active: { bg: '#E1F7EC', color: '#16A35A', label: 'Active' },
  suspended: { bg: '#FDEAEA', color: '#C0282A', label: 'Suspended' },
  rejected: { bg: '#F0EAF0', color: '#6C6080', label: 'Rejected' },
}

export default function UserTable({ users, currentUserId, currentUserRole }) {
  const supabase = createClient()
  const router = useRouter()
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = users.filter(u => {
    if (statusFilter && u.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!u.full_name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function updateUser(userId, changes, logAction, logDetails) {
    setBusyId(userId)
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)
    setBusyId(null)
    if (error) { alert('Error: ' + error.message); return }
    if (logAction) await logActivity(supabase, logAction, logDetails)
    router.refresh()
  }

  async function handleDelete(userId, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setBusyId(userId)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    setBusyId(null)
    if (error) { alert('Error: ' + error.message); return }
    router.refresh()
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-[#FFF3DC] text-[#B06800] px-4 py-2.5 rounded-xl text-sm font-semibold mb-5 w-fit">
          {pendingCount} registration{pendingCount === 1 ? '' : 's'} waiting for approval
        </div>
      )}

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa]" />
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#ddd] text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#ddd] rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[#eee] bg-[#FAFAF8]">
              <th className="p-3 text-xs text-[#888]">User</th>
              <th className="p-3 text-xs text-[#888]">Department</th>
              <th className="p-3 text-xs text-[#888]">Role</th>
              <th className="p-3 text-xs text-[#888]">Status</th>
              <th className="p-3 text-xs text-[#888]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-[#888]">No users match this filter.</td></tr>
            )}
            {filtered.map(u => {
              const s = STATUS_STYLE[u.status] || STATUS_STYLE.pending
              const initials = (u.full_name || u.email || '?').slice(0, 1).toUpperCase()
              const isBusy = busyId === u.id
              return (
                <tr key={u.id} className={`border-b border-[#f2f2f0] hover:bg-[#FAFAF8] ${isBusy ? 'opacity-50' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0f3d28] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
                      <div>
                        <div className="font-medium">{u.full_name || '—'}</div>
                        <div className="text-[11px] text-[#999]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[#666]">{u.department || '—'}</td>
                  <td className="p-3">
                    {u.id === currentUserId ? (
                      <span className="capitalize text-[#333]">{u.role.replace('_', ' ')}</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={currentUserRole !== 'super_admin' || isBusy}
                        onChange={e => updateUser(u.id, { role: e.target.value })}
                        className="border border-[#ddd] rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {u.status === 'pending' && (
                        <>
                          <button onClick={() => updateUser(u.id, { status: 'active' }, 'user_approved', { name: u.full_name || u.email })} disabled={isBusy} className="flex items-center gap-1 px-2.5 py-1 bg-[#E1F7EC] text-[#16A35A] rounded-md text-xs font-semibold"><Check size={12} /> Approve</button>
                          <button onClick={() => updateUser(u.id, { status: 'rejected' }, 'user_status_changed', { name: u.full_name || u.email })} disabled={isBusy} className="flex items-center gap-1 px-2.5 py-1 bg-[#F0EAF0] text-[#6C6080] rounded-md text-xs font-semibold"><X size={12} /> Reject</button>
                        </>
                      )}
                      {u.status === 'active' && u.id !== currentUserId && (
                        <button onClick={() => updateUser(u.id, { status: 'suspended' }, 'user_status_changed', { name: u.full_name || u.email })} disabled={isBusy} className="flex items-center gap-1 px-2.5 py-1 bg-[#FDEAEA] text-[#C0282A] rounded-md text-xs font-semibold"><Ban size={12} /> Suspend</button>
                      )}
                      {(u.status === 'suspended' || u.status === 'rejected') && (
                        <button onClick={() => updateUser(u.id, { status: 'active' }, 'user_status_changed', { name: u.full_name || u.email })} disabled={isBusy} className="flex items-center gap-1 px-2.5 py-1 bg-[#E1F7EC] text-[#16A35A] rounded-md text-xs font-semibold"><RotateCcw size={12} /> Reactivate</button>
                      )}
                      {u.id !== currentUserId && (
                        <button onClick={() => handleDelete(u.id, u.full_name || u.email)} disabled={isBusy} className="flex items-center gap-1 px-2.5 py-1 border border-[#ddd] rounded-md text-xs text-red-600"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}