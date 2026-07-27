import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: assignments } = await supabase
    .from('task_assignments')
    .select('checklist_items(id, label, priority, due_date, item_status, sections(label, pills(name, branches(name))))')
    .eq('user_id', user.id)

  const tasks = (assignments || []).map(a => a.checklist_items).filter(Boolean)

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>My Tasks</h1>
      <p><a href="/">← Back home</a></p>
      {tasks.length === 0 && <p>No tasks assigned to you yet.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '8px' }}>Task</th>
            <th style={{ padding: '8px' }}>Where</th>
            <th style={{ padding: '8px' }}>Priority</th>
            <th style={{ padding: '8px' }}>Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{t.label}</td>
              <td style={{ padding: '8px' }}>{t.sections?.pills?.branches?.name} → {t.sections?.pills?.name} → {t.sections?.label}</td>
              <td style={{ padding: '8px' }}>{t.priority}</td>
              <td style={{ padding: '8px' }}>{t.due_date || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}