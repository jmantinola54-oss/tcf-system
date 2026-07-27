export async function logActivity(supabase, action, details = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action,
      details,
    })
  } catch (e) {
    // Logging should never block the actual action from completing
    console.error('Audit log failed:', e)
  }
}