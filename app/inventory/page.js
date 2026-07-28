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
  const { data: withdrawals } = await supabase
    .from('inventory_withdrawals')
    .select('id, qty, person, created_at, inventory_items(name)')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">Inventory</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Stock levels, withdrawals & restocks</p>
      <InventoryView
        initialItems={items || []}
        initialWithdrawals={withdrawals || []}
        currentUserName={profile.full_name || user.email}
      />
    </div>
  )
}