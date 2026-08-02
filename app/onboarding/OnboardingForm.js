'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingForm({ profile, branches }) {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [department, setDepartment] = useState('')
  const [branchId, setBranchId] = useState(branches[0] ? branches[0].id : '')
  const [position, setPosition] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return }
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          department: department.trim() || null,
          branch_id: branchId || null,
          position: position.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', profile.id)

      if (error) throw error

      // Best-effort read of the current status so we can send an already-
      // active person straight in. maybeSingle() (not single()) means this
      // never throws even if a read-back RLS policy isn't set up — if we
      // can't confirm the status, we default to the safe choice: /hold.
      let finalStatus = 'pending'
      const { data: statusRow } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', profile.id)
        .maybeSingle()
      if (statusRow && statusRow.status) finalStatus = statusRow.status

      const destination = finalStatus === 'active' ? '/' : '/hold'

      // Refresh first so the server/middleware picks up onboarding_completed,
      // then navigate. Doing push() immediately followed by refresh() can
      // let the refresh win the race and leave the user stuck on this page.
      router.refresh()
      router.push(destination)
    } catch (err) {
      setErrorMsg(err && err.message ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF7F1] px-4">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-9 max-w-md w-full">
        <img src="/tcf-logo.png" alt="TCF Logo" className="w-14 h-14 rounded-xl mb-5 object-contain" />
        <h1 className="font-display text-xl font-bold text-[#0f3d28] mb-1">Complete your profile</h1>
        <p className="text-[#6E9A7C] text-sm mb-7">Almost there — just a few details before an admin reviews your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-[#FDEAEA] text-[#C0282A] text-xs font-medium rounded-lg px-3 py-2.5">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Full name</label>
            <input value={fullName} onChange={function (e) { setFullName(e.target.value) }} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Department</label>
            <input value={department} onChange={function (e) { setDepartment(e.target.value) }} placeholder="e.g. Administrative, Nursing..." className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Branch</label>
            <select value={branchId} onChange={function (e) { setBranchId(e.target.value) }} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm">
              {branches.length === 0 && <option value="">No branches yet</option>}
              {branches.map(function (b) { return <option key={b.id} value={b.id}>{b.name}</option> })}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Position <span className="text-[#aaa] font-normal">(optional)</span></label>
            <input value={position} onChange={function (e) { setPosition(e.target.value) }} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}