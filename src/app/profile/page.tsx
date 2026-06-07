'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, QrCode, Group, Receipt, Star, ShieldAlert } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  split_id: string
  avatar_url?: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({ groups: 0, expenses: 0, settled: 100 })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(prof)

        // 2. Fetch Groups Count
        const { count: groupCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // 3. Fetch Expenses Count (created by this user)
        const { count: expenseCount } = await supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('paid_by', user.id)

        // Calculate a "Settlement Score" (100 if you owe nothing, otherwise lower)
        // Fetch if user has negative balances
        const { data: gmData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        let settledScore = 100
        if (gmData && gmData.length > 0) {
          const groupIds = gmData.map(gm => gm.group_id)
          
          const { data: groupExpenses } = await supabase
            .from('expenses')
            .select('*, expense_splits(*)')
            .in('group_id', groupIds)

          const { data: groupSettlements } = await supabase
            .from('settlements')
            .select('*')
            .in('group_id', groupIds)

          let netBalance = 0
          groupExpenses?.forEach(exp => {
            const mySplit = exp.expense_splits?.find((s: any) => s.user_id === user.id)
            if (exp.paid_by === user.id) {
              netBalance += Number(exp.amount) - (mySplit ? Number(mySplit.amount) : 0)
            } else if (mySplit) {
              netBalance -= Number(mySplit.amount)
            }
          })

          groupSettlements?.forEach(sett => {
            if (sett.payer_id === user.id) {
              netBalance += Number(sett.amount)
            } else if (sett.payee_id === user.id) {
              netBalance -= Number(sett.amount)
            }
          })

          // If net balance is negative, we deduct some score to encourage settlement
          if (netBalance < -0.005) {
            settledScore = Math.max(50, Math.round(100 + (netBalance / 10)))
          }
        }

        setStats({
          groups: groupCount || 0,
          expenses: expenseCount || 0,
          settled: settledScore,
        })

      } catch (err) {
        console.error('Error loading profile data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  const copyToClipboard = () => {
    if (!profile) return
    navigator.clipboard.writeText(profile.split_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="lg:ml-32 pt-24 px-6 lg:px-12 pb-24 max-w-4xl mx-auto space-y-12">
      {/* SPLIT ID CARD */}
      <div className="relative group">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[44px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative glass-thick rounded-[40px] p-8 md:p-12 border-white/10 flex flex-col items-center text-center gap-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
            <QrCode className="w-48 h-48" />
          </div>

          <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center shadow-lg p-4 relative">
            {/* Simulated QR Code matrix */}
            <div className="grid grid-cols-6 gap-1.5 w-full h-full">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-[1.5px] ${
                    // Preset a nice QR look
                    i % 7 === 0 || i % 9 === 0 || i < 6 || i % 6 === 0 || (i > 30 && i < 36)
                      ? 'bg-slate-900 dark:bg-white'
                      : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase block">
              Your Split ID
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mono bg-gradient-to-r from-foreground to-slate-400 bg-clip-text text-transparent">
              {profile?.split_id || 'SPX-XXXXXX'}
            </h2>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Share this ID with friends to split bills anonymously.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={copyToClipboard}
              className="px-6 py-3.5 glass-card rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Copied ID!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Split ID
                </>
              )}
            </button>
            <div className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 w-full sm:w-auto">
              <Star className="w-4 h-4" /> Verified Profile
            </div>
          </div>
        </div>
      </div>

      {/* USER INFORMATION */}
      <div className="glass-card p-8 rounded-3xl space-y-6">
        <h3 className="text-lg font-bold">Profile Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs uppercase font-bold tracking-widest block">Full Name</span>
            <span className="font-semibold text-base">{profile?.full_name}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-xs uppercase font-bold tracking-widest block">Email Address</span>
            <span className="font-semibold text-base">{profile?.email}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-xs uppercase font-bold tracking-widest block">Account Created</span>
            <span className="font-semibold text-base">
              {profile ? new Date(profile.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : '...'}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-xs uppercase font-bold tracking-widest block">Privacy Status</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-base">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Emails & Phone Protected
            </span>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-3xl text-center space-y-2">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
            <Group className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold tracking-tighter">{stats.groups}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Groups Joined</div>
        </div>
        
        <div className="glass-card p-8 rounded-3xl text-center space-y-2">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-purple-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold tracking-tighter">{stats.expenses}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expenses Added</div>
        </div>

        <div className="glass-card p-8 rounded-3xl text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
            <Check className="w-5 h-5" />
          </div>
          <div className="text-4xl font-extrabold tracking-tighter">{stats.settled}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Settled Score</div>
        </div>
      </div>
    </main>
  )
}
