'use client'

import { useState, Fragment } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logActivity } from '../lib/audit'

function statusFor(item) {
  if (item.qty <= 0) return { label: 'Out of stock', color: '#C0282A' }
  if (item.qty <= item.threshold) return { label: 'Low stock', color: '#B06800' }
  return { label: 'In stock', color: '#16A35A' }
}

function nextCode(items) {
  const nums = items
    .map(i => parseInt((i.code || '').replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return 'ITM-' + String(next).padStart(3, '0')
}

export default function InventoryView({ initialItems, currentUserName }) {
  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [actionRow, setActionRow] = useState(null)
  const [busy, setBusy] = useState(false)

  const [newItem, setNewItem] = useState({ name: '', uom: 'pcs', qty: 0, threshold: 1, description: '' })
  const [actionForm, setActionForm] = useState({ qty: 1, person: currentUserName, department: '', notes: '' })

  const filtered = initialItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItem.name.trim()) { alert('Enter an item name.'); return }
    setBusy(true)
    const { error } = await supabase.from('inventory_items').insert({
      code: nextCode(initialItems),
      name: newItem.name.trim(),
      uom: newItem.uom || 'pcs',
      qty: Number(newItem.qty) || 0,
      threshold: Number(newItem.threshold) || 1,
      description: newItem.description || null,
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

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ qty: newQty })
      .eq('id', item.id)

    if (updateError) { setBusy(false); alert('Error: ' + updateError.message); return }

    if (actionRow.type === 'withdraw') {
      await supabase.from('inventory_withdrawals').insert({
        item_id: item.id, qty, person: actionForm.person, department: actionForm.department, notes: actionForm.notes,
      })
    } else {
      await supabase.from('inventory_restocks').insert({
        item_id: item.id, qty, person: actionForm.person, notes: actionForm.notes,
      })
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
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <input
          placeholder="Search by name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px' }}
        />
        <button onClick={() => setShowAdd(s => !s)}>{showAdd ? 'Cancel' : '+ Add item'}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddItem} style={{ background: '#F5FAF6', padding: 16, borderRadius: 10, marginBottom: 20, display: 'grid', gap: 8 }}>
          <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Unit (pcs, box…)" value={newItem.uom} onChange={e => setNewItem({ ...newItem, uom: e.target.value })} style={{ width: 120 }} />
            <input type="number" placeholder="Starting qty" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} style={{ width: 120 }} />
            <input type="number" placeholder="Low-stock threshold" value={newItem.threshold} onChange={e => setNewItem({ ...newItem, threshold: e.target.value })} style={{ width: 160 }} />
          </div>
          <input placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
          <button type="submit" disabled={busy}>Save item</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Code</th>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>UOM</th>
            <th style={{ padding: 8 }}>Qty</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No items found</td></tr>
          )}
          {filtered.map(item => {
            const status = statusFor(item)
            return (
              <Fragment key={item.id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{item.code}</td>
                  <td style={{ padding: 8 }}>{item.name}</td>
                  <td style={{ padding: 8 }}>{item.uom}</td>
                  <td style={{ padding: 8, fontWeight: 'bold' }}>{item.qty}</td>
                  <td style={{ padding: 8, color: status.color, fontWeight: 'bold' }}>{status.label}</td>
                  <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                    <button onClick={() => openAction(item.id, 'withdraw')}>↑ Withdraw</button>
                    <button onClick={() => openAction(item.id, 'restock')}>↓ Restock</button>
                    <button onClick={() => handleDelete(item)} style={{ color: 'red' }}>Delete</button>
                  </td>
                </tr>
                {actionRow?.itemId === item.id && (
                  <tr>
                    <td colSpan={6} style={{ background: '#F5FAF6', padding: 14 }}>
                      <strong>{actionRow.type === 'withdraw' ? 'Record withdrawal' : 'Record restock'}</strong>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="number" placeholder="Qty" value={actionForm.qty} onChange={e => setActionForm({ ...actionForm, qty: e.target.value })} style={{ width: 90 }} />
                        <input placeholder="Person" value={actionForm.person} onChange={e => setActionForm({ ...actionForm, person: e.target.value })} style={{ width: 160 }} />
                        {actionRow.type === 'withdraw' && (
                          <input placeholder="Department" value={actionForm.department} onChange={e => setActionForm({ ...actionForm, department: e.target.value })} style={{ width: 140 }} />
                        )}
                        <input placeholder="Notes (optional)" value={actionForm.notes} onChange={e => setActionForm({ ...actionForm, notes: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
                        <button onClick={() => submitAction(item)} disabled={busy}>Confirm</button>
                        <button onClick={() => setActionRow(null)}>Cancel</button>
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
  )
}