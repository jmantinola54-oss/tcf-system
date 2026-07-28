'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '../../lib/audit'
import { Plus } from 'lucide-react'

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PRIORITY_STYLE = {
  low: { bg: '#F0EAF0', color: '#6C6080' },
  medium: { bg: '#E9F5EC', color: '#204A2E' },
  high: { bg: '#FFF3DC', color: '#B06800' },
  critical: { bg: '#FDEAEA', color: '#C0282A' },
}

export default function TaskManager({ sections, users, items, currentUserId }) {
  const supabase = createClient()
  const router = useRouter()

  const [sectionId, setSectionId] = useState(sections[0]?.id || '')
  const [label, setLabel] = useState('')
  const [department, setDepartment] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [saving, setSaving] = useState(false)

  function toggleUser(id) {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!label.trim() || !sectionId) { alert('Enter a task name and pick a section.'); return }
    setSaving(true)

    const { data: newItem, error: itemError } = await supabase.from('checklist_items').insert({
      section_id: sectionId, label: label.trim(), assigned_department: department || null, priority, due_date: dueDate || null,
    }).select().single()

    if (itemError) { alert('Error creating task: ' + itemError.message); setSaving(false); return }

    if (selectedUsers.length > 0) {
      const assignments = selectedUsers.map(userId => ({ checklist_item_id: newItem.id, user_id: userId, assigned_by: currentUserId }))
      const { error: assignError } = await supabase.from('task_assignments').insert(assignments)
      if (assignError) alert('Task created, but assigning users failed: ' + assignError.message)

      const notifications = selectedUsers.map(userId => ({ user_id: userId, type: 'task_assigned', message: `You've been assigned: ${label.trim()}`, related_task_id: newItem.id }))
      await supabase.from('notifications').insert(notifications)
    }

    await logActivity(supabase, 'task_created', { label: label.trim() })

    setSaving(false)
    setLabel(''); setDepartment(''); setDueDate(''); setSelectedUsers([])
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-6 mb-8">
        <h3 className="font-display font-bold text-[#0f3d28] mb-4 flex items-center gap-2"><Plus size={16} /> Create & assign a task</h3>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#666] block mb-1">Section</label>
            <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm">
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.pills?.branches?.name} → {s.pills?.name} → {s.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#666] block mb-1">Task name</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Submit weekly report" className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Department</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="optional" className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#666] block mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-[#666] block mb-2">Assign to</label>
          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <label key={u.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${selectedUsers.includes(u.id) ? 'bg-[#0f3d28] text-white border-[#0f3d28]' : 'border-[#ddd] text-[#555]'}`}>
                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} className="hidden" />
                {u.full_name || u.email}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold">
          {saving ? 'Creating…' : 'Create task'}
        </button>
      </form>

      <h3 className="font-display font-bold text-[#0f3d28] mb-3">Existing tasks</h3>
      <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[#eee] bg-[#FAFAF8]">
              <th className="p-3 text-xs text-[#888]">Task</th>
              <th className="p-3 text-xs text-[#888]">Section</th>
              <th className="p-3 text-xs text-[#888]">Priority</th>
              <th className="p-3 text-xs text-[#888]">Due</th>
              <th className="p-3 text-xs text-[#888]">Assigned to</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-[#888]">No tasks created yet.</td></tr>
            )}
            {items.map(item => {
              const p = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
              return (
                <tr key={item.id} className="border-b border-[#f2f2f0] hover:bg-[#FAFAF8]">
                  <td className="p-3 font-medium">{item.label}</td>
                  <td className="p-3 text-[#666]">{item.sections?.label}</td>
                  <td className="p-3"><span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.bg, color: p.color }}>{item.priority}</span></td>
                  <td className="p-3 text-[#666]">{item.due_date || '—'}</td>
                  <td className="p-3 text-[#666]">
                    {item.task_assignments?.length ? item.task_assignments.map(a => a.profiles?.full_name || a.profiles?.email).join(', ') : '—'}
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