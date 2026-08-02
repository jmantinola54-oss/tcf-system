import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
    }

    // 1. Verify the caller is a logged-in, active admin — using the normal
    //    cookie-scoped client, never trust the client for this.
    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }

    if (caller.id === userId) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', caller.id)
      .single()

    const isAdmin = callerProfile && ['admin', 'super_admin'].includes(callerProfile.role) && callerProfile.status === 'active'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }

    // 2. Do the actual delete with the service role key, which bypasses RLS.
    //    Delete the profile row first (in case there's no ON DELETE CASCADE
    //    from auth.users -> profiles), then remove the auth account itself
    //    so the person can't just sign back in and get a fresh profile.
    const admin = createAdminClient()

    const { error: profileError } = await admin.from('profiles').delete().eq('id', userId)
    if (profileError) {
      return NextResponse.json({ error: 'Failed to delete profile: ' + profileError.message }, { status: 500 })
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: 'Profile removed, but failed to delete the login account: ' + authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err && err.message ? err.message : 'Unexpected error.' }, { status: 500 })
  }
}