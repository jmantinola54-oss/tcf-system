'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { ShieldCheck, UserCheck, Sparkles } from 'lucide-react'

const STEPS = [
  { icon: Sparkles, text: 'Sign up with your Google account' },
  { icon: UserCheck, text: 'Tell us your department & branch' },
  { icon: ShieldCheck, text: 'An admin approves your access' },
]

export default function SignupPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignup() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex bg-[#EEF7F1]">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#0f3d28] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <img src="/tcf-logo.png" alt="TCF Logo" className="w-11 h-11 rounded-lg bg-white p-1.5 object-contain" />
            <div>
              <div className="font-bold text-white text-[15px] leading-tight">TCF</div>
              <div className="text-[9px] text-white/50 uppercase tracking-wider">Production System</div>
            </div>
          </div>

          <h1 className="font-display text-4xl font-extrabold text-white leading-tight mb-4">
            Get set up<br />in three<br />quick steps.
          </h1>
          <p className="text-white/60 text-sm max-w-sm">
            Your account is reviewed by an administrator before you get access — this keeps every branch's data secure.
          </p>
        </div>

        <div className="relative space-y-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 relative">
                  <Icon size={16} className="text-white" />
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-white text-[#0f3d28] text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <span className="text-white/80 text-sm">{s.text}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <img src="/tcf-logo.png" alt="TCF Logo" className="w-11 h-11 rounded-lg bg-white border border-[#e5e5e0] p-1.5 object-contain" />
            <div>
              <div className="font-bold text-[#0f3d28] text-[15px] leading-tight">TCF</div>
              <div className="text-[9px] text-[#6E9A7C] uppercase tracking-wider">Production System</div>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">Create your account</h2>
          <p className="text-[#6E9A7C] text-sm mb-8">Sign up with Google — it only takes a moment</p>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#0f3d28] hover:bg-[#14512f] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
                <path fill="#FBBC05" d="M3.96 10.71c-.18-.54-.29-1.11-.29-1.71s.1-1.17.29-1.71V4.96H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.04l3-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3 2.34C4.67 5.16 6.66 3.58 9 3.58z" />
              </svg>
            )}
            {loading ? 'Continuing…' : 'Continue with Google'}
          </button>

          <p className="text-center text-xs text-[#999] mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0f3d28] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}