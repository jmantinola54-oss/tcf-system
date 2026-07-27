import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Welcome, {profile?.full_name || user.email}</h1>
      <p>User ID: {user.id}</p>
      <p>Role: {profile?.role}</p>
      <p>Status: {profile?.status}</p>
      {error && (
        <pre style={{ color: 'red', background: '#fee', padding: '10px' }}>
          Error: {JSON.stringify(error, null, 2)}
        </pre>
      )}
      {profile?.status === 'pending' && (
        <p style={{ color: '#b06800' }}>Your account is waiting for administrator approval.</p>
      )}
      {profile?.status === 'active' && (
        <p><a href="/tasks">→ My Tasks</a></p>
      )}
      {profile?.status === 'active' && (
        <p><a href="/checklist">→ Checklist</a></p>
      )}
      {profile?.status === 'active' && (
        <p><a href="/inventory">→ Inventory</a></p>
      )}


      {['admin', 'super_admin'].includes(profile?.role) && (
        <>
          <p><a href="/admin/users">→ User Management</a></p>
          <p><a href="/admin/tasks">→ Task Assignment</a></p>
        </>
      )}
    </div>
  )
}