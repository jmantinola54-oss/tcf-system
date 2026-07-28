import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: branches } = await supabase.from('branches').select('id, name').order('name')

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">My Profile</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Manage your account details</p>
      <ProfileForm profile={profile} branches={branches || []} />
    </div>
  )
}