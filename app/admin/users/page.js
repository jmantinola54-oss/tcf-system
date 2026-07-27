import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './UserTable'

export const dynamic = 'force-dynamic'

export default async function UsersAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  // Only active admins/super_admins get past this point — everyone else
  // gets bounced back to the homepage.
  if (!myProfile || !['admin', 'super_admin'].includes(myProfile.role) || myProfile.status !== 'active') {
    redirect('/')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>User Management</h1>
      <UserTable users={users || []} currentUserId={user.id} currentUserRole={myProfile.role} />
    </div>
  )
}