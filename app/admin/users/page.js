import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './UserTable'

export const dynamic = 'force-dynamic'

export default async function UsersAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!myProfile || !['admin', 'super_admin'].includes(myProfile.role) || myProfile.status !== 'active') redirect('/')

  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1 tracking-tight">User Management</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Approve registrations, manage roles and account status</p>
      <UserTable users={users || []} currentUserId={user.id} currentUserRole={myProfile.role} />
    </div>
  )
}