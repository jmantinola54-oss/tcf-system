import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function pillProgress(pill) {
  let total = 0, done = 0
  pill.sections?.forEach(sec => {
    sec.checklist_items?.forEach(item => {
      if (item.parent_id) return
      total++
      if (item.checked) done++
    })
  })
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
}

export default async function BranchPage({ params }) {
  const { branchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: branch } = await supabase.from('branches').select('id, name').eq('id', branchId).single()
  const { data: pills } = await supabase
    .from('pills')
    .select('id, name, sections(id, checklist_items(id, checked, parent_id))')
    .eq('branch_id', branchId)
    .order('name')

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">{branch?.name}</h1>
      <p className="mb-4"><a href="/checklist" className="text-sm text-[#0f3d28] font-semibold hover:underline">← All Branches</a></p>

      {(!pills || pills.length === 0) && (
        <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">
          No checklists in this branch yet.
        </div>
      )}

      <div className="grid gap-4 mt-5">
        {pills?.map(pill => {
          const { total, done, pct } = pillProgress(pill)
          return (
            <a key={pill.id} href={`/checklist/pill/${pill.id}`} className="block">
              <div className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[#0A1F12] text-[15px]">{pill.name}</span>
                  <span className="font-display text-xl font-extrabold text-[#0A1F12]">{pct}%</span>
                </div>
                <div className="text-xs text-[#888] my-2">{done} / {total} complied</div>
                <div className="bg-[#eee] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#16A35A]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}