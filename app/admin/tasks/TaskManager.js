'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, UserPlus } from 'lucide-react'

const PRIORITY_STYLE = {
  low: { bg: '#F0EAF0', color: '#6C6080' },
  medium: { bg: '#E9F5EC', color: '#204A2E' },
  high: { bg: '#FFF3DC', color: '#B06800' },
  critical: { bg: '#FDEAEA', color: '#C0282A' },
}

export default function TaskManager({ items, users }) {
  const supabase = createClient()
  const router = useRouter()
  const [busyId, setBusyId] = useState(null)
  const userList = users || []

  async function handleUnassign(itemId, assignmentId) {
    setBusyId(itemId)
    const res = await supabase.from('task_assignments').delete().eq('id', assignmentId)
    setBusyId(null)
    if (res.error) { alert('Error: ' + res.error.message); return }
    router.refresh()
  }

  async function handleAssign(item, userId) {
    if (!userId) return
    setBusyId(item.id)

    const authRes = await supabase.auth.getUser()
    const currentAuthUser = authRes.data && authRes.data.user ? authRes.data.user : null

    const res = await supabase.from('task_assignments').insert({
      checklist_item_id: item.id,
      user_id: userId,
      assigned_by: currentAuthUser ? currentAuthUser.id : null,
    })

    if (!res.error) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'task_assigned',
        message: "You've been assigned: " + item.label,
        related_task_id: item.id,
      })
    }

    setBusyId(null)
    if (res.error) { alert('Error: ' + res.error.message); return }
    router.refresh()
  }

  return (
    <div>
      <h3 className="font-display font-bold text-[#0f3d28] mb-3">Existing tasks</h3>
      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left border-b border-[#eee] bg-[#FAFAF8]">
                <th className="p-3 text-xs text-[#888]">Task</th>
                <th className="p-3 text-xs text-[#888]">Section</th>
                <th className="p-3 text-xs text-[#888]">Priority</th>
                <th className="p-3 text-xs text-[#888]">Status</th>
                <th className="p-3 text-xs text-[#888]">Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-[#888]">No tasks yet. Assign someone to an item from the checklist&apos;s edit (pencil) icon, or right here in the &quot;Assigned to&quot; column.</td></tr>
              )}
              {items.map(function (item) {
                const p = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
                const assignments = item.task_assignments || []
                const isBusy = busyId === item.id
                const assignedIds = assignments.map(function (a) { return a.user_id })
                const availableUsers = userList.filter(function (u) { return assignedIds.indexOf(u.id) === -1 })

                return (
                  <tr key={item.id} className={'border-b border-[#f2f2f0] hover:bg-[#FAFAF8] ' + (isBusy ? 'opacity-60' : '')}>
                    <td className="p-3 font-medium">{item.label}</td>
                    <td className="p-3 text-[#666]">{item.sections ? item.sections.label : ''}</td>
                    <td className="p-3"><span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.bg, color: p.color }}>{item.priority}</span></td>
                    <td className="p-3">
                      {item.checked ? (
                        <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#E1F7EC] text-[#16A35A]">Completed</span>
                      ) : (
                        <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#EEF2EF] text-[#5C6B62]">Pending</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {assignments.length === 0 && (
                          <span className="text-[11px] text-[#999] italic mr-0.5">Unassigned</span>
                        )}
                        {assignments.map(function (a) {
                          return (
                            <span key={a.id} className="flex items-center gap-1 bg-[#EEF2EF] text-[#333] text-[11px] px-2 py-1 rounded-full">
                              {a.profiles ? (a.profiles.full_name || a.profiles.email) : 'Unknown'}
                              <button onClick={function () { handleUnassign(item.id, a.id) }} disabled={isBusy} className="text-[#999] hover:text-red-600">
                                <X size={11} />
                              </button>
                            </span>
                          )
                        })}

                        {availableUsers.length > 0 && (
                          <div className="relative inline-flex items-center">
                            <select
                              value=""
                              disabled={isBusy}
                              onChange={function (e) { handleAssign(item, e.target.value) }}
                              className="appearance-none text-[11px] font-semibold pl-6 pr-2 py-1 rounded-full border border-dashed border-[#bbb] text-[#0f3d28] bg-white hover:bg-[#F5FAF6] cursor-pointer disabled:opacity-50"
                            >
                              <option value="">Assign…</option>
                              {availableUsers.map(function (u) {
                                return <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                              })}
                            </select>
                            <UserPlus size={11} className="absolute left-2 text-[#999] pointer-events-none" />
                          </div>
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
    </div>
  )
}