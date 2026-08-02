import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import NotificationBell from './components/NotificationBell'
import AppShell from './components/AppShell'
import { createClient } from '../lib/supabase/server'

export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TCF Production System",
  description: "TCF Production Checklist & Inventory System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Any page middleware has already routed correctly (login, signup,
  // onboarding, hold) except the real active-user app gets the shell.
  const showShell = profile && profile.onboarding_completed && profile.status === 'active'

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {showShell ? (
          <AppShell profile={profile}>
            <NotificationBell />
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  )
}