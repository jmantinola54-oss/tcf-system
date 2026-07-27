'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUS_COLORS = {
  pending: '#B06800',
  active: '#16A35A',
  suspended: '#C0282A',
  rejected: '#6C6080',
}

export default function UserTable({ users, currentUserId, currentUserRole }) {
  const supabase = createClient()
  const router = useRouter()
  const [busyId, setBusyId] = useState(null)

  async function updateUser(userId, changes) {
    setBusyId(userId)
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)
    setBusyId(null)
    if (error) { alert('Error: ' + error.message); return }
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

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '10px' }}>Name</th>
          <th style={{ padding: '10px' }}>Email</th>
          <th style={{ padding: '10px' }}>Department</th>
          <th style={{ padding: '10px' }}>Role</th>
          <th style={{ padding: '10px' }}>Status</th>
          <th style={{ padding: '10px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} style={{ borderBottom: '1px solid #eee', opacity: busyId === u.id ? 0.5 : 1 }}>
            <td style={{ padding: '10px' }}>{u.full_name || '—'}</td>
            <td style={{ padding: '10px' }}>{u.email}</td>
            <td style={{ padding: '10px' }}>{u.department || '—'}</td>
            <td style={{ padding: '10px' }}>
              {u.id === currentUserId ? u.role : (
                <select
                  value={u.role}
                  disabled={currentUserRole !== 'super_admin' || busyId === u.id}
                  onChange={e => updateUser(u.id, { role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
              )}
            </td>
            <td style={{ padding: '10px', color: STATUS_COLORS[u.status] || '#000', fontWeight: 'bold' }}>
              {u.status}
            </td>
            <td style={{ padding: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {u.status === 'pending' && (
                <>
                  <button onClick={() => updateUser(u.id, { status: 'active' })} disabled={busyId === u.id}>Approve</button>
                  <button onClick={() => updateUser(u.id, { status: 'rejected' })} disabled={busyId === u.id}>Reject</button>
                </>
              )}
              {u.status === 'active' && u.id !== currentUserId && (
                <button onClick={() => updateUser(u.id, { status: 'suspended' })} disabled={busyId === u.id}>Suspend</button>
              )}
              {(u.status === 'suspended' || u.status === 'rejected') && (
                <button onClick={() => updateUser(u.id, { status: 'active' })} disabled={busyId === u.id}>Reactivate</button>
              )}
              {u.id !== currentUserId && (
                <button onClick={() => handleDelete(u.id, u.full_name || u.email)} disabled={busyId === u.id} style={{ color: 'red' }}>Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}