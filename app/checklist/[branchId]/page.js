import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

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
    .select('id, name, sections(id, checklist_items(id, checked))')
    .eq('branch_id', branchId)
    .order('name')

  function pillProgress(pill) {
    let total = 0, done = 0
    pill.sections?.forEach(sec => {
      sec.checklist_items?.forEach(item => {
        total++
        if (item.checked) done++
      })
    })
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>{branch?.name}</h1>
      <p><a href="/checklist">← All Branches</a></p>

      {(!pills || pills.length === 0) && <p>No checklists in this branch yet.</p>}

      <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        {pills?.map(pill => {
          const { total, done, pct } = pillProgress(pill)
          return (
            <a key={pill.id} href={`/checklist/pill/${pill.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 16 }}>{pill.name}</strong>
                  <span style={{ fontSize: 20, fontWeight: 'bold', color: '#0f3d28' }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', margin: '4px 0 8px' }}>{done} / {total} complied</div>
                <div style={{ background: '#eee', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: '#16A35A', height: '100%' }} />
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}