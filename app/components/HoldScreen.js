'use client'

import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Clock, Ban, ShieldOff } from 'lucide-react'

const STATE_CONFIG = {
  pending: {
    icon: Clock,
    iconBg: '#FFF3DC',
    iconColor: '#B06800',
    title: 'Waiting for approval',
    accent: '#B06800',
    message: "An administrator needs to approve your account before you can access the system.",
    sub: "You don't need to sign up again — this page will unlock automatically once you're approved.",
  },
  rejected: {
    icon: Ban,
    iconBg: '#FDEAEA',
    iconColor: '#C0282A',
    title: 'Registration declined',
    accent: '#C0282A',
    message: "Your account request wasn't approved.",
    sub: "If you believe this is a mistake, please reach out to an administrator directly.",
  },
  suspended: {
    icon: ShieldOff,
    iconBg: '#FDEAEA',
    iconColor: '#C0282A',
    title: 'Account suspended',
    accent: '#C0282A',
    message: 'Your access to this system has been suspended.',
    sub: 'Contact an administrator if you believe this is a mistake.',
  },
}

export default function HoldScreen({ profile }) {
  const supabase = createClient()
  const router = useRouter()

  const config = STATE_CONFIG[profile.status] || STATE_CONFIG.pending
  const Icon = config.icon

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF7F1] px-4">
      <div className="bg-white rounded-3xl shadow-xl px-8 py-10 max-w-sm w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: config.accent }} />

        <img src="/tcf-logo.png" alt="TCF Logo" className="w-12 h-12 mx-auto rounded-lg mb-6 object-contain" />

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: config.iconBg }}
        >
          <Icon size={28} color={config.iconColor} strokeWidth={2} />
        </div>

        <h1 className="font-display text-xl font-bold text-[#0f3d28] mb-2">{config.title}</h1>

        <p className="text-sm font-semibold mb-1.5" style={{ color: config.accent }}>
          Hi {profile.full_name || profile.email},
        </p>
        <p className="text-[#444] text-sm mb-3 leading-relaxed">
          {config.message}
        </p>
        <p className="text-[#999] text-xs leading-relaxed">
          {config.sub}
        </p>

        <button
          onClick={handleLogout}
          className="w-full mt-7 py-2.5 border border-[#ddd] rounded-xl text-sm font-semibold text-[#333] hover:bg-[#F5FAF6] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}