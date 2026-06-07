'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  History,
  User,
  Settings,
  LogOut,
  HandCoins
} from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Hide navbars on landing and auth pages
  const isAuthOrLanding = pathname === '/' || pathname === '/login' || pathname === '/signup'
  if (isAuthOrLanding) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Friends', href: '/friends', icon: UserCheck },
    { name: 'Settlements', href: '/settlements', icon: HandCoins },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed left-6 top-6 bottom-6 w-24 hidden lg:flex flex-col items-center py-8 glass-thick rounded-[32px] z-50 border-white/5 shadow-2xl">
        {/* Brand logo */}
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-indigo-500/25">
          <span className="font-extrabold text-xl text-white">S</span>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-6 flex-1 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                
                {/* Custom Tooltip */}
                <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg border border-white/5 font-medium whitespace-nowrap shadow-xl">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-2xl flex items-center justify-center transition-all duration-300 group relative"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-slate-900/90 text-rose-400 text-xs px-3 py-1.5 rounded-lg border border-rose-500/10 font-medium whitespace-nowrap shadow-xl">
            Sign Out
          </span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 glass-thick rounded-[24px] z-50 flex items-center justify-around px-2 shadow-2xl border-white/5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          )}
        )}
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
    </>
  )
}
