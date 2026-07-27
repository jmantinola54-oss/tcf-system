'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function NotificationBell() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data || [])
    }
    load()
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markAsRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (!userId) return null // signed out — don't show the bell at all

  return (
    <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 100 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -6, right: -6, background: '#C0282A', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', width: 320, maxHeight: 400, overflowY: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #eee' }}>
            <strong>Notifications</strong>
            {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 12 }}>Mark all read</button>}
          </div>
          {notifications.length === 0 && <div style={{ padding: '14px', color: '#888' }}>No notifications yet</div>}
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', background: n.read ? '#fff' : '#F5FAF6', cursor: n.read ? 'default' : 'pointer' }}
            >
              <div style={{ fontSize: 13 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}