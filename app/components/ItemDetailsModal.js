'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Plus, Trash2, ChevronDown } from 'lucide-react'
import { logActivity } from '../lib/audit'

const STATUSES = ['not_started', 'in_progress', 'pending_review', 'completed', 'overdue', 'na']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

export default function ItemDetailsModal({ item, categories, users, isAdmin, onCategoriesChange, onClose }) {
  const supabase = createClient()
  const router = useRouter()
  const cats = categories || []
  const userList = users || []
  const currentAssignment = item.task_assignments && item.task_assignments[0] ? item.task_assignments[0] : null

  const [form, setForm] = useState({
    category: item.category || '',
    priority: item.priority || 'medium',
    item_status: item.item_status || 'not_started',
    due_date: item.due_date || '',
    remarks: item.remarks || '',
    doc_links: item.doc_links || [],
    assigned_user_id: currentAssignment ? currentAssignment.user_id : '',
  })
  const [newLink, setNewLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showNewCatForm, setShowNewCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#0f3d28')
  const [savingCat, setSavingCat] = useState(false)

  const selectedCategory = cats.find(function (c) { return c.name === form.category })

  function addLink() {
    const url = newLink.trim()
    if (!url) return
    setForm(function (f) {
      const next = Object.assign({}, f)
      next.doc_links = f.doc_links.concat([url])
      return next
    })
    setNewLink('')
  }

  function removeLink(idx) {
    setForm(function (f) {
      const next = Object.assign({}, f)
      next.doc_links = f.doc_links.filter(function (_, i) { return i !== idx })
      return next
    })
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    const res = await supabase.from('checklist_categories').upsert({ name: newCatName.trim(), color: newCatColor }, { onConflict: 'name' })
    setSavingCat(false)
    if (res.error) { alert('Error: ' + res.error.message); return }
    setForm(function (f) {
      const next = Object.assign({}, f)
      next.category = newCatName.trim()
      return next
    })
    setNewCatName('')
    setNewCatColor('#0f3d28')
    setShowNewCatForm(false)
    setShowCatDropdown(false)
    if (onCategoriesChange) await onCategoriesChange()
  }

  async function syncAssignment() {
    if (!isAdmin) return
    const currentUserId = currentAssignment ? currentAssignment.user_id : null
    const nextUserId = form.assigned_user_id || null
    if (currentUserId === nextUserId) return

    await supabase.from('task_assignments').delete().eq('checklist_item_id', item.id)

    if (nextUserId) {
      const authRes = await supabase.auth.getUser()
      const currentAuthUser = authRes.data && authRes.data.user ? authRes.data.user : null
      await supabase.from('task_assignments').insert({
        checklist_item_id: item.id,
        user_id: nextUserId,
        assigned_by: currentAuthUser ? currentAuthUser.id : null,
      })
      await supabase.from('notifications').insert({
        user_id: nextUserId,
        type: 'task_assigned',
        message: "You've been assigned: " + item.label,
        related_task_id: item.id,
      })
    }
  }

  async function handleSave() {
    setSaving(true)
    const res = await supabase.from('checklist_items').update({
      category: form.category || null,
      priority: form.priority,
      item_status: form.item_status,
      due_date: form.due_date || null,
      remarks: form.remarks || null,
      doc_links: form.doc_links,
    }).eq('id', item.id)

    if (res.error) { setSaving(false); alert('Error: ' + res.error.message); return }

    await syncAssignment()
    await logActivity(supabase, 'item_edited', { label: item.label })

    setSaving(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mb-16" onClick={function (e) { e.stopPropagation() }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <h3 className="font-display font-bold text-[#0f3d28]">Item Details</h3>
          <button onClick={onClose} className="text-[#999] hover:text-[#333]"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm font-semibold text-[#333]">{item.label}</div>

          <div className="relative">
            <label className="text-xs font-semibold text-[#666] block mb-1">Category</label>
            <button
              type="button"
              onClick={function () { setShowCatDropdown(function (o) { return !o }) }}
              className="w-full flex items-center justify-between border border-[#ddd] rounded-lg px-3 py-2 text-sm text-left"
            >
              <span className="flex items-center gap-2">
                {selectedCategory && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selectedCategory.color }} />}
                {form.category || '- None -'}
              </span>
              <ChevronDown size={14} className="text-[#999]" />
            </button>

            {showCatDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-[#eee] rounded-lg shadow-lg max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={function () {
                    setForm(function (f) {
                      const next = Object.assign({}, f)
                      next.category = ''
                      return next
                    })
                    setShowCatDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5FAF6]"
                >
                  - None -
                </button>
                {cats.map(function (c) {
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={function () {
                        setForm(function (f) {
                          const next = Object.assign({}, f)
                          next.category = c.name
                          return next
                        })
                        setShowCatDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5FAF6] flex items-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} /> {c.name}
                    </button>
                  )
                })}
                <div className="border-t border-[#eee] p-2">
                  {!showNewCatForm ? (
                    <button type="button" onClick={function () { setShowNewCatForm(true) }} className="w-full flex items-center gap-1.5 text-xs font-semibold text-[#0f3d28] px-1 py-1">
                      <Plus size={12} /> Add new category
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        placeholder="Category name..."
                        value={newCatName}
                        onChange={function (e) { setNewCatName(e.target.value) }}
                        onKeyDown={function (e) { if (e.key === 'Enter') handleCreateCategory() }}
                        className="w-full border border-[#ddd] rounded-md px-2 py-1.5 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input type="color" value={newCatColor} onChange={function (e) { setNewCatColor(e.target.value) }} className="w-8 h-8 border border-[#ddd] rounded-md cursor-pointer flex-shrink-0" />
                        <button type="button" onClick={handleCreateCategory} disabled={savingCat} className="flex-1 px-2 py-1.5 bg-[#0f3d28] text-white rounded-md text-xs font-semibold">
                          {savingCat ? 'Adding...' : 'Add'}
                        </button>
                        <button type="button" onClick={function () { setShowNewCatForm(false) }} className="px-2 py-1.5 border border-[#ddd] rounded-md text-xs">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1">Person in charge</label>
              <select
                value={form.assigned_user_id}
                onChange={function (e) {
                  const val = e.target.value
                  setForm(function (f) {
                    const next = Object.assign({}, f)
                    next.assigned_user_id = val
                    return next
                  })
                }}
                className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              >
                <option value="">- Unassigned -</option>
                {userList.map(function (u) {
                  return <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                })}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={function (e) {
                  const val = e.target.value
                  setForm(function (f) {
                    const next = Object.assign({}, f)
                    next.priority = val
                    return next
                  })
                }}
                className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              >
                {PRIORITIES.map(function (p) { return <option key={p} value={p}>{p}</option> })}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1">Status</label>
              <select
                value={form.item_status}
                onChange={function (e) {
                  const val = e.target.value
                  setForm(function (f) {
                    const next = Object.assign({}, f)
                    next.item_status = val
                    return next
                  })
                }}
                className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map(function (s) { return <option key={s} value={s}>{s.replace('_', ' ')}</option> })}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Due date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={function (e) {
                const val = e.target.value
                setForm(function (f) {
                  const next = Object.assign({}, f)
                  next.due_date = val
                  return next
                })
              }}
              className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={function (e) {
                const val = e.target.value
                setForm(function (f) {
                  const next = Object.assign({}, f)
                  next.remarks = val
                  return next
                })
              }}
              rows={3}
              className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Document links</label>
            {form.doc_links.length === 0 && <p className="text-xs text-[#999] mb-1.5">No links added yet.</p>}
            {form.doc_links.map(function (link, idx) {
              return (
                <div key={idx} className="flex items-center gap-2 mb-1.5">
                  <button type="button" onClick={function () { window.open(link, '_blank', 'noreferrer') }} className="text-xs text-blue-600 truncate flex-1 text-left hover:underline">
                    {link}
                  </button>
                  <button type="button" onClick={function () { removeLink(idx) }} className="text-red-500 flex-shrink-0"><Trash2 size={13} /></button>
                </div>
              )
            })}
            <div className="flex gap-2 mt-1">
              <input
                placeholder="Paste a link..."
                value={newLink}
                onChange={function (e) { setNewLink(e.target.value) }}
                onKeyDown={function (e) { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                className="flex-1 border border-[#ddd] rounded-lg px-3 py-1.5 text-xs"
              />
              <button type="button" onClick={addLink} className="px-2.5 border border-[#ddd] rounded-lg"><Plus size={13} /></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#eee]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#ddd]">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-[#0f3d28] text-white font-semibold">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}