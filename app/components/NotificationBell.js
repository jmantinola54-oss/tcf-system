'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Bell } from 'lucide-react'

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
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
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

  if (!userId) return null

  return (
    <div className="fixed top-3 right-4 lg:top-4 lg:right-6 z-[100]">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center bg-white border border-[#e5e5e0] rounded-full shadow-sm hover:shadow transition-shadow"
      >
        <Bell size={16} className="text-[#0f3d28]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#C0282A] text-white rounded-full min-w-[16px] h-4 px-1 text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 max-h-[420px] overflow-y-auto bg-white border border-[#e5e5e0] rounded-xl shadow-lg z-[100]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
              <span className="font-semibold text-sm text-[#0f3d28]">Notifications</span>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-[11px] text-[#0f3d28] font-semibold hover:underline">Mark all read</button>}
            </div>
            {notifications.length === 0 && <div className="p-6 text-center text-[#999] text-xs">No notifications yet</div>}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`px-4 py-3 border-b border-[#f5f5f3] last:border-0 ${n.read ? 'bg-white' : 'bg-[#F5FAF6] cursor-pointer'}`}
              >
                <div className="text-[12.5px] text-[#222]">{n.message}</div>
                <div className="text-[10.5px] text-[#999] mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}