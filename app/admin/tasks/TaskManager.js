'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

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
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!label.trim() || !sectionId) { alert('Enter a task name and pick a section.'); return }
    setSaving(true)

    const { data: newItem, error: itemError } = await supabase
      .from('checklist_items')
      .insert({
        section_id: sectionId,
        label: label.trim(),
        assigned_department: department || null,
        priority,
        due_date: dueDate || null,
      })
      .select()
      .single()

    if (itemError) { alert('Error creating task: ' + itemError.message); setSaving(false); return }

    if (selectedUsers.length > 0) {
      const assignments = selectedUsers.map(userId => ({
        checklist_item_id: newItem.id,
        user_id: userId,
        assigned_by: currentUserId,
      }))
      const { error: assignError } = await supabase.from('task_assignments').insert(assignments)
      if (assignError) alert('Task created, but assigning users failed: ' + assignError.message)

      const notifications = selectedUsers.map(userId => ({
        user_id: userId,
        type: 'task_assigned',
        message: `You've been assigned: ${label.trim()}`,
        related_task_id: newItem.id,
      }))
      await supabase.from('notifications').insert(notifications)
    }

    setSaving(false)
    setLabel(''); setDepartment(''); setDueDate(''); setSelectedUsers([])
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleCreate} style={{ background: '#F5FAF6', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Create & assign a task</h3>

        <div style={{ marginBottom: '10px' }}>
          <label>Section: </label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.pills?.branches?.name} → {s.pills?.name} → {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Task name: </label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Submit weekly report" style={{ width: '300px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Department: </label>
          <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="optional" />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Priority: </label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Due date: </label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Assign to:</label><br />
          {users.map(u => (
            <label key={u.id} style={{ display: 'inline-block', marginRight: '14px' }}>
              <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} /> {u.full_name || u.email}
            </label>
          ))}
        </div>

        <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create task'}</button>
      </form>

      <h3>Existing tasks</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '8px' }}>Task</th>
            <th style={{ padding: '8px' }}>Section</th>
            <th style={{ padding: '8px' }}>Priority</th>
            <th style={{ padding: '8px' }}>Due</th>
            <th style={{ padding: '8px' }}>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{item.label}</td>
              <td style={{ padding: '8px' }}>{item.sections?.label}</td>
              <td style={{ padding: '8px' }}>{item.priority}</td>
              <td style={{ padding: '8px' }}>{item.due_date || '—'}</td>
              <td style={{ padding: '8px' }}>
                {item.task_assignments?.length ? item.task_assignments.map(a => a.profiles?.full_name || a.profiles?.email).join(', ') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}