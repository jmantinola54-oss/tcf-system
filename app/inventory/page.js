import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryView from './InventoryView'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('status, full_name').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: items } = await supabase.from('inventory_items').select('*').order('code')

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>Inventory</h1>
      <p><a href="/">← Back home</a></p>
      <InventoryView initialItems={items || []} currentUserName={profile.full_name || user.email} />
    </div>
  )
}