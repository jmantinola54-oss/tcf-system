'use client'

import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#EEF7F1',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#0f3d28', marginBottom: '8px' }}>TCF Production System</h1>
        <p style={{ color: '#6E9A7C', marginBottom: '24px' }}>Sign in to continue</p>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: '12px 24px',
            background: '#0f3d28',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}