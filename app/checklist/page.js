import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ChecklistOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: branches, error } = await supabase
    .from('branches')
    .select('id, name, pills(id, sections(id, checklist_items(id, checked)))')
    .order('name')

  function branchProgress(branch) {
    let total = 0, done = 0
    branch.pills?.forEach(pill => {
      pill.sections?.forEach(section => {
        section.checklist_items?.forEach(item => {
          total++
          if (item.checked) done++
        })
      })
    })
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>Checklist — All Branches</h1>
      <p><a href="/">← Back home</a></p>

      {error && (
        <pre style={{ color: 'red', background: '#fee', padding: '10px' }}>
          Error: {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {(!branches || branches.length === 0) && !error && <p>No branches yet.</p>}

      <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        {branches?.map(branch => {
          const { total, done, pct } = branchProgress(branch)
          return (
            <a key={branch.id} href={`/checklist/${branch.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 16 }}>{branch.name}</strong>
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