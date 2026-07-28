'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingForm({ profile, branches }) {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [department, setDepartment] = useState('')
  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [position, setPosition] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim()) { alert('Please enter your full name.'); return }
    setSaving(true)

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      department: department.trim() || null,
      branch_id: branchId || null,
      position: position.trim() || null,
      onboarding_completed: true,
    }).eq('id', profile.id)

    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF7F1] px-4">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-9 max-w-md w-full">
        <img src="/tcf-logo.png" alt="TCF Logo" className="w-14 h-14 rounded-xl mb-5 object-contain" />
        <h1 className="font-display text-xl font-bold text-[#0f3d28] mb-1">Complete your profile</h1>
        <p className="text-[#6E9A7C] text-sm mb-7">Almost there — just a few details before an admin reviews your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Department</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Administrative, Nursing…" className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Branch</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm">
              {branches.length === 0 && <option value="">No branches yet</option>}
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#666] block mb-1">Position <span className="text-[#aaa] font-normal">(optional)</span></label>
            <input value={position} onChange={e => setPosition(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}