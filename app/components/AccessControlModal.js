'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { X, Network, Check } from 'lucide-react'

export default function AccessControlModal({ user, onClose }) {
  const supabase = createClient()
  const [branches, setBranches] = useState([])
  const [selectedPillIds, setSelectedPillIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(function () {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [branchesRes, accessRes] = await Promise.all([
        supabase.from('branches').select('id, name, sort_order, pills(id, name, sort_order)').order('sort_order'),
        supabase.from('user_pill_access').select('pill_id').eq('user_id', user.id),
      ])

      if (cancelled) return

      setBranches(branchesRes.data || [])
      setSelectedPillIds(new Set((accessRes.data || []).map(function (r) { return r.pill_id })))
      setLoading(false)
    }

    load()
    return function () { cancelled = true }
  }, [user.id, supabase])

  const hasRestrictions = selectedPillIds.size > 0

  function togglePill(pillId) {
    setSelectedPillIds(function (prev) {
      const next = new Set(prev)
      if (next.has(pillId)) next.delete(pillId)
      else next.add(pillId)
      return next
    })
  }

  function toggleBranch(branch, allSelected) {
    setSelectedPillIds(function (prev) {
      const next = new Set(prev)
      const pillIds = (branch.pills || []).map(function (p) { return p.id })
      if (allSelected) {
        pillIds.forEach(function (id) { next.delete(id) })
      } else {
        pillIds.forEach(function (id) { next.add(id) })
      }
      return next
    })
  }

  function clearAll() {
    setSelectedPillIds(new Set())
  }

  async function handleSave() {
    setSaving(true)
    setErrorMsg('')

    const del = await supabase.from('user_pill_access').delete().eq('user_id', user.id)
    if (del.error) { setSaving(false); setErrorMsg('Error: ' + del.error.message); return }

    if (selectedPillIds.size > 0) {
      const rows = Array.from(selectedPillIds).map(function (pillId) { return { user_id: user.id, pill_id: pillId } })
      const ins = await supabase.from('user_pill_access').insert(rows)
      if (ins.error) { setSaving(false); setErrorMsg('Error: ' + ins.error.message); return }
    }

    setSaving(false)
    onClose(true)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-10 sm:pt-16 z-50 overflow-y-auto px-3" onClick={function () { onClose(false) }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl mb-10" onClick={function (e) { e.stopPropagation() }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <div>
            <h3 className="font-display font-bold text-[#0f3d28]">Checklist access</h3>
            <p className="text-xs text-[#888] mt-0.5">{user.full_name || user.email}</p>
          </div>
          <button onClick={function () { onClose(false) }} className="text-[#999] hover:text-[#333]"><X size={18} /></button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#666]">
              {hasRestrictions
                ? 'This person only sees the pills checked below.'
                : 'No restrictions set — this person can see every branch and pill.'}
            </p>
            {hasRestrictions && (
              <button onClick={clearAll} className="text-xs font-semibold text-[#C0282A] flex-shrink-0 ml-3 hover:underline">Clear restrictions</button>
            )}
          </div>

          {errorMsg && (
            <div className="bg-[#FDEAEA] text-[#C0282A] text-xs font-medium rounded-lg px-3 py-2.5 mb-4">{errorMsg}</div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-[#888]">Loading...</div>
          ) : branches.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#888]">No branches set up yet.</div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {branches.map(function (branch) {
                const pills = branch.pills || []
                const allSelected = pills.length > 0 && pills.every(function (p) { return selectedPillIds.has(p.id) })
                return (
                  <div key={branch.id} className="border border-[#eee] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FAFAF8] border-b border-[#eee]">
                      <div className="flex items-center gap-2">
                        <Network size={14} className="text-[#0f3d28]" />
                        <span className="text-sm font-semibold text-[#0f3d28]">{branch.name}</span>
                      </div>
                      {pills.length > 0 && (
                        <button onClick={function () { toggleBranch(branch, allSelected) }} className="text-[11px] font-semibold text-[#0f3d28] hover:underline">
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                      )}
                    </div>
                    {pills.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs text-[#999]">No pills in this branch yet.</div>
                    ) : (
                      <div className="p-2">
                        {pills.map(function (pill) {
                          const checked = selectedPillIds.has(pill.id)
                          return (
                            <button
                              key={pill.id}
                              type="button"
                              onClick={function () { togglePill(pill.id) }}
                              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F5FAF6] text-left"
                            >
                              <span className={'w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ' + (checked ? 'bg-[#16A35A] border-[#16A35A]' : 'border-[#ccc]')}>
                                {checked && <Check size={11} strokeWidth={3} className="text-white" />}
                              </span>
                              <span className="text-sm text-[#333]">{pill.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#eee]">
          <button onClick={function () { onClose(false) }} className="px-4 py-2 text-sm rounded-lg border border-[#ddd] hover:bg-[#f5f5f5]">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="px-4 py-2 text-sm rounded-lg bg-[#0f3d28] hover:bg-[#14512f] text-white font-semibold transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : 'Save access'}
          </button>
        </div>
      </div>
    </div>
  )
}