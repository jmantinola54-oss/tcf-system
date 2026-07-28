'use client'

import { useState, Fragment } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '../lib/audit'
import { LayoutGrid, Boxes, Search } from 'lucide-react'

function statusFor(item) {
  if (item.qty <= 0) return { label: 'Out of stock', color: '#C0282A', bg: '#FDEAEA' }
  if (item.qty <= item.threshold) return { label: 'Low stock', color: '#B06800', bg: '#FFF3DC' }
  return { label: 'In stock', color: '#16A35A', bg: '#E1F7EC' }
}

function nextCode(items) {
  const nums = items.map(i => parseInt((i.code || '').replace(/\D/g, ''), 10)).filter(n => !isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return 'ITM-' + String(next).padStart(3, '0')
}

function DashboardCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e0] p-5 shadow-sm">
      <div className="text-xs text-[#888] mb-2">{label}</div>
      <div className="font-display text-3xl font-extrabold" style={{ color: color || '#0A1F12' }}>{value}</div>
    </div>
  )
}

export default function InventoryView({ initialItems, initialWithdrawals, currentUserName }) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState('dashboard') // dashboard | inventory
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [actionRow, setActionRow] = useState(null)
  const [busy, setBusy] = useState(false)

  const [newItem, setNewItem] = useState({ name: '', uom: 'pcs', qty: 0, threshold: 1, description: '' })
  const [actionForm, setActionForm] = useState({ qty: 1, person: currentUserName, department: '', notes: '' })

  const filtered = initialItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalItems = initialItems.length
  const inStock = initialItems.filter(i => i.qty > i.threshold).length
  const lowStock = initialItems.filter(i => i.qty > 0 && i.qty <= i.threshold).length
  const outStock = initialItems.filter(i => i.qty <= 0).length
  const needsAttention = initialItems.filter(i => i.qty <= i.threshold)

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItem.name.trim()) { alert('Enter an item name.'); return }
    setBusy(true)
    const { error } = await supabase.from('inventory_items').insert({
      code: nextCode(initialItems), name: newItem.name.trim(), uom: newItem.uom || 'pcs',
      qty: Number(newItem.qty) || 0, threshold: Number(newItem.threshold) || 1, description: newItem.description || null,
    })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'inventory_added', { name: newItem.name.trim() })
    setNewItem({ name: '', uom: 'pcs', qty: 0, threshold: 1, description: '' })
    setShowAdd(false)
    router.refresh()
  }

  function openAction(itemId, type) {
    setActionRow({ itemId, type })
    setActionForm({ qty: 1, person: currentUserName, department: '', notes: '' })
  }

  async function submitAction(item) {
    const qty = Number(actionForm.qty)
    if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return }
    if (actionRow.type === 'withdraw' && qty > item.qty) { alert('Not enough stock available.'); return }
    setBusy(true)
    const newQty = actionRow.type === 'withdraw' ? item.qty - qty : item.qty + qty
    const { error: updateError } = await supabase.from('inventory_items').update({ qty: newQty }).eq('id', item.id)
    if (updateError) { setBusy(false); alert('Error: ' + updateError.message); return }
    if (actionRow.type === 'withdraw') {
      await supabase.from('inventory_withdrawals').insert({ item_id: item.id, qty, person: actionForm.person, department: actionForm.department, notes: actionForm.notes })
    } else {
      await supabase.from('inventory_restocks').insert({ item_id: item.id, qty, person: actionForm.person, notes: actionForm.notes })
    }
    await logActivity(supabase, actionRow.type === 'withdraw' ? 'inventory_withdraw' : 'inventory_restock', { item_name: item.name, qty })
    setBusy(false)
    setActionRow(null)
    router.refresh()
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setBusy(true)
    const { error } = await supabase.from('inventory_items').delete().eq('id', item.id)
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'inventory_deleted', { name: item.name })
    router.refresh()
  }

  return (
    <div>
      <div className="flex bg-[#F0EAF0] rounded-lg p-1 w-fit mb-6">
        <button onClick={() => setTab('dashboard')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${tab === 'dashboard' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>
          <LayoutGrid size={13} /> Dashboard
        </button>
        <button onClick={() => setTab('inventory')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${tab === 'inventory' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>
          <Boxes size={13} /> Inventory
        </button>
      </div>

      {tab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <DashboardCard label="Total items" value={totalItems} />
            <DashboardCard label="In stock" value={inStock} color="#16A35A" />
            <DashboardCard label="Low stock" value={lowStock} color="#B06800" />
            <DashboardCard label="Out of stock" value={outStock} color="#C0282A" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f2f2f0] font-semibold text-sm text-[#0f3d28]">Items needing attention</div>
              {needsAttention.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#888]">All items in stock ✓</div>
              ) : (
                needsAttention.map((item, idx) => {
                  const s = statusFor(item)
                  return (
                    <div key={item.id} className={`flex items-center justify-between px-5 py-2.5 ${idx !== needsAttention.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}>
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-[11px] text-[#999]">{item.code}</div>
                      </div>
                      <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  )
                })
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f2f2f0] font-semibold text-sm text-[#0f3d28]">Recent withdrawals</div>
              {initialWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#888]">No withdrawals yet</div>
              ) : (
                initialWithdrawals.map((w, idx) => (
                  <div key={w.id} className={`flex items-center justify-between px-5 py-2.5 ${idx !== initialWithdrawals.length - 1 ? 'border-b border-[#f2f2f0]' : ''}`}>
                    <div>
                      <div className="text-sm font-medium">{w.inventory_items?.name || '—'}</div>
                      <div className="text-[11px] text-[#999]">{w.person || '—'}</div>
                    </div>
                    <span className="text-sm font-bold text-[#B06800]">-{w.qty}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa]" />
              <input placeholder="Search by name or code…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#ddd] text-sm" />
            </div>
            <button onClick={() => setShowAdd(s => !s)} className="px-4 py-2 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold">{showAdd ? 'Cancel' : '+ Add item'}</button>
          </div>

          {showAdd && (
            <form onSubmit={handleAddItem} className="bg-[#F5FAF6] p-4 rounded-xl mb-5 grid gap-2">
              <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <input placeholder="Unit (pcs, box…)" value={newItem.uom} onChange={e => setNewItem({ ...newItem, uom: e.target.value })} className="w-32 border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Starting qty" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} className="w-32 border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Low-stock threshold" value={newItem.threshold} onChange={e => setNewItem({ ...newItem, threshold: e.target.value })} className="w-40 border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="px-4 py-2 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold w-fit">Save item</button>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left border-b border-[#eee] bg-[#FAFAF8]">
                    <th className="p-3 text-xs text-[#888]">Code</th>
                    <th className="p-3 text-xs text-[#888]">Name</th>
                    <th className="p-3 text-xs text-[#888]">UOM</th>
                    <th className="p-3 text-xs text-[#888]">Qty</th>
                    <th className="p-3 text-xs text-[#888]">Status</th>
                    <th className="p-3 text-xs text-[#888]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-[#888]">No items found</td></tr>
                  )}
                  {filtered.map(item => {
                    const status = statusFor(item)
                    return (
                      <Fragment key={item.id}>
                        <tr className="border-b border-[#f2f2f0]">
                          <td className="p-3">{item.code}</td>
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3">{item.uom}</td>
                          <td className="p-3 font-bold">{item.qty}</td>
                          <td className="p-3"><span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span></td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => openAction(item.id, 'withdraw')} className="px-2.5 py-1 text-xs border border-[#ddd] rounded-md">↑ Withdraw</button>
                              <button onClick={() => openAction(item.id, 'restock')} className="px-2.5 py-1 text-xs border border-[#ddd] rounded-md">↓ Restock</button>
                              <button onClick={() => handleDelete(item)} className="px-2.5 py-1 text-xs border border-[#ddd] rounded-md text-red-600">Delete</button>
                            </div>
                          </td>
                        </tr>
                        {actionRow?.itemId === item.id && (
                          <tr>
                            <td colSpan={6} className="bg-[#F5FAF6] p-4">
                              <strong className="text-sm">{actionRow.type === 'withdraw' ? 'Record withdrawal' : 'Record restock'}</strong>
                              <div className="flex gap-2 mt-2 flex-wrap items-center">
                                <input type="number" placeholder="Qty" value={actionForm.qty} onChange={e => setActionForm({ ...actionForm, qty: e.target.value })} className="w-20 border border-[#ddd] rounded-lg px-2 py-1.5 text-sm" />
                                <input placeholder="Person" value={actionForm.person} onChange={e => setActionForm({ ...actionForm, person: e.target.value })} className="w-40 border border-[#ddd] rounded-lg px-2 py-1.5 text-sm" />
                                {actionRow.type === 'withdraw' && (
                                  <input placeholder="Department" value={actionForm.department} onChange={e => setActionForm({ ...actionForm, department: e.target.value })} className="w-36 border border-[#ddd] rounded-lg px-2 py-1.5 text-sm" />
                                )}
                                <input placeholder="Notes" value={actionForm.notes} onChange={e => setActionForm({ ...actionForm, notes: e.target.value })} className="flex-1 min-w-[140px] border border-[#ddd] rounded-lg px-2 py-1.5 text-sm" />
                                <button onClick={() => submitAction(item)} disabled={busy} className="px-3 py-1.5 bg-[#0f3d28] text-white rounded-lg text-xs font-semibold">Confirm</button>
                                <button onClick={() => setActionRow(null)} className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}