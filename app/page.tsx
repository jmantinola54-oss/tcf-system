import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.status === 'pending') {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f3d28' }}>Welcome, {profile.full_name}</h1>
        <p style={{ color: '#B06800', fontWeight: 600 }}>
          Your account is waiting for administrator approval.
        </p>
        <p style={{ color: '#6E9A7C', fontSize: 13 }}>
          You'll be able to access the system once an admin approves your account.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ color: '#0f3d28', marginBottom: 4 }}>Welcome, {profile?.full_name || user.email}</h1>
      <p style={{ color: '#6E9A7C', marginBottom: 30 }}>Here's what's happening today.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <a href="/checklist" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 24 }}>📋</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Checklist</div>
            <div style={{ fontSize: 12, color: '#888' }}>Branches & progress</div>
          </div>
        </a>
        <a href="/tasks" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 24 }}>✅</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>My Tasks</div>
            <div style={{ fontSize: 12, color: '#888' }}>Assigned to you</div>
          </div>
        </a>
        <a href="/inventory" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 24 }}>📦</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Inventory</div>
            <div style={{ fontSize: 12, color: '#888' }}>Stock & withdrawals</div>
          </div>
        </a>
      </div>
    </div>
  )
}