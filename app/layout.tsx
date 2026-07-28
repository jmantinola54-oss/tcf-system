import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationBell from './components/NotificationBell'
import AppShell from './components/AppShell'
import HoldScreen from './components/HoldScreen'
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

  // Not signed in at all (login/signup pages) -> render as-is, no shell.
  if (!profile) {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    )
  }

  // Still filling out onboarding -> let that page render on its own, no shell.
  if (!profile.onboarding_completed) {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    )
  }

  // Pending / suspended / rejected -> full-screen hold, never the dashboard.
  if (profile.status !== 'active') {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          <HoldScreen profile={profile} />
        </body>
      </html>
    )
  }

  // Active -> the real app.
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppShell profile={profile}>
          <NotificationBell />
          {children}
        </AppShell>
      </body>
    </html>
  )
}