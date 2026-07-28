'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUS_STYLE = {
  pending: { bg: '#FFF3DC', color: '#B06800' },
  active: { bg: '#E1F7EC', color: '#16A35A' },
  suspended: { bg: '#FDEAEA', color: '#C0282A' },
  rejected: { bg: '#F0EAF0', color: '#6C6080' },
}

export default function ProfileForm({ profile, branches }) {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [department, setDepartment] = useState(profile?.department || '')
  const [position, setPosition] = useState(profile?.position || '')
  const [branchId, setBranchId] = useState(profile?.branch_id || '')
  const [saving, setSaving] = useState(false)

  const initials = (fullName || profile?.email || '?').slice(0, 1).toUpperCase()
  const s = STATUS_STYLE[profile?.status] || STATUS_STYLE.pending

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(), department: department.trim() || null, position: position.trim() || null, branch_id: branchId || null,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#0f3d28] text-white flex items-center justify-center text-2xl font-bold">{initials}</div>
        <div>
          <div className="font-display font-bold text-lg text-[#0A1F12]">{profile?.full_name || profile?.email}</div>
          <div className="text-xs text-[#888]">{profile?.email}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: '#F0EAF0', color: '#6C6080' }}>{profile?.role?.replace('_', ' ')}</span>
            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{profile?.status}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">Full name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">Department</label>
          <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">Position</label>
          <input value={position} onChange={e => setPosition(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#666] block mb-1">Branch</label>
          <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm">
            <option value="">— None —</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <button onClick={handleLogout} className="w-full mt-4 py-2.5 border border-[#ddd] rounded-lg text-sm text-red-600 font-semibold">
        Sign out
      </button>
    </div>
  )
}