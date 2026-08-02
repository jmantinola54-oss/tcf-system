import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivityLogView from './ActivityLogView'

export const dynamic = 'force-dynamic'

export default async function ActivityLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role) || profile.status !== 'active') redirect('/')

  const { data: logs } = await supabase
    .from('audit_log')
    .select('id, action, details, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1 tracking-tight">Activity Log</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Last 200 actions across the system</p>
      <ActivityLogView logs={logs || []} />
    </div>
  )
}