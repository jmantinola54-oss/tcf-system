'use client'

import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HoldScreen({ profile }) {
  const supabase = createClient()
  const router = useRouter()

  const isPending = profile.status === 'pending'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF7F1] px-4">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-10 max-w-sm w-full text-center">
        <img src="/tcf-logo.png" alt="TCF Logo" className="w-14 h-14 mx-auto rounded-xl mb-5 object-contain" />

        {isPending ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#FFF3DC] flex items-center justify-center mx-auto mb-5 text-3xl">⏳</div>
            <h1 className="font-display text-xl font-bold text-[#0f3d28] mb-2">Waiting for approval</h1>
            <p className="text-[#B06800] font-semibold text-sm mb-1">
              Hi {profile.full_name || profile.email}, your account is pending review.
            </p>
            <p className="text-[#6E9A7C] text-xs">
              An administrator needs to approve your account before you can access the system. You don't need to sign up again — just check back later.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#FDEAEA] flex items-center justify-center mx-auto mb-5 text-3xl">🚫</div>
            <h1 className="font-display text-xl font-bold text-[#0f3d28] mb-2">Access unavailable</h1>
            <p className="text-[#C0282A] font-semibold text-sm mb-1">
              Your account access has been {profile.status}.
            </p>
            <p className="text-[#6E9A7C] text-xs">
              Contact an administrator if you believe this is a mistake.
            </p>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full mt-6 py-2.5 border border-[#ddd] rounded-lg text-sm font-semibold text-[#333] hover:bg-[#F5FAF6]"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}