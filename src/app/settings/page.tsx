'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Sparkles, Shield, User, HelpCircle } from 'lucide-react'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-4xl mx-auto space-y-12">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">Preferences</h2>
        <p className="text-slate-400 text-sm mt-1">Configure your SplitID layout, security, and appearance.</p>
      </header>

      {/* APPEARANCE SECTION */}
      <section className="glass-thick p-6 md:p-8 rounded-[32px] border-white/5 space-y-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Theme Configuration
          </h3>
          <p className="text-xs text-slate-400">Choose your preferred user interface scheme.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Light Theme Option */}
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`p-6 rounded-2xl border flex flex-col justify-between items-start gap-4 transition-all text-left group cursor-pointer ${
              theme === 'light'
                ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-400'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Light Theme</h4>
              <p className="text-xs text-slate-500 mt-1">Sleek slate backgrounds with clean layout borders.</p>
            </div>
          </button>

          {/* Dark Theme Option */}
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`p-6 rounded-2xl border flex flex-col justify-between items-start gap-4 transition-all text-left group cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-400'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Dark Theme</h4>
              <p className="text-xs text-slate-500 mt-1">Deep blue/space colors with vibrant glassmorphism blends.</p>
            </div>
          </button>
        </div>
      </section>

      {/* SECURITY & PRIVACY */}
      <section className="glass-thick p-6 md:p-8 rounded-[32px] border-white/5 space-y-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Privacy & Security
          </h3>
          <p className="text-xs text-slate-400">Details on how SplitID keeps your identity anonymous.</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Split ID Masking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your phone number and email address are never exposed to other users. Friends can only search, identify, and invite you via your unique Split ID.
              </p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Row Level Security (RLS)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All data transactions are bound by PostgreSQL RLS layers. Only validated group members can query group expenses, splits, and record settlements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HELPFUL SUPPORT */}
      <section className="glass-thick p-6 md:p-8 rounded-[32px] border-white/5 space-y-4 shadow-xl">
        <h3 className="font-bold text-base flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" /> Need Help?
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          If you have questions about calculations, receipts storage, or settling balances, please review the developer guidelines or contact the admin panel.
        </p>
      </section>
    </main>
  )
}
