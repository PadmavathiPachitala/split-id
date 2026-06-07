'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getAvatarFallback } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  ArrowUpRight,
  UserPlus,
  FileText,
  IndianRupee,
  Activity,
  UserCheck
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  split_id: string
  avatar_url?: string
}

interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

interface Expense {
  id: string
  title: string
  amount: number
  paid_by: string
  group_id: string
  created_at: string
  profiles?: {
    full_name: string
  }
}

interface GroupBalance {
  groupId: string
  groupName: string
  balance: number
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOwed, setTotalOwed] = useState(0) // what others owe you (sum of positive balances)
  const [totalOwe, setTotalOwe] = useState(0)   // what you owe others (sum of negative balances)
  const [monthlySpend, setMonthlySpend] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 2. Get profile
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profData)

        // 3. Get user's groups
        const { data: gmData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        if (!gmData || gmData.length === 0) {
          setLoading(false)
          return
        }

        const groupIds = gmData.map((gm) => gm.group_id)

        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
        setGroups(groupsData || [])

        // 4. Fetch all expenses for these groups
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*, profiles:paid_by(full_name)')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })

        // 5. Fetch all splits for these expenses
        const expenseIds = (expensesData || []).map((e) => e.id)
        let splitsData: any[] = []
        if (expenseIds.length > 0) {
          const { data: sData } = await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds)
          splitsData = sData || []
        }

        // 6. Fetch all settlements
        const { data: settlementsData } = await supabase
          .from('settlements')
          .select('*')
          .in('group_id', groupIds)

        // Calculate Balances
        let calculatedOwed = 0
        let calculatedOwe = 0
        let calculatedSpend = 0
        const calculatedBalances: GroupBalance[] = []
        const currentMonth = new Date().getMonth()

        groupsData?.forEach((group) => {
          let balance = 0

          // Calculate expenses in this group
          const groupExpenses = (expensesData || []).filter((e) => e.group_id === group.id)
          groupExpenses.forEach((exp) => {
            const expSplits = splitsData.filter((s) => s.expense_id === exp.id)
            const mySplit = expSplits.find((s) => s.user_id === user.id)

            // If I paid the expense
            if (exp.paid_by === user.id) {
              const othersOwe = Number(exp.amount) - (mySplit ? Number(mySplit.amount) : 0)
              balance += othersOwe
            } else if (mySplit) {
              // If someone else paid and I owe a share
              balance -= Number(mySplit.amount)
            }

            // Spend calculation (sum of my shares of expenses in current month)
            const expDate = new Date(exp.created_at)
            if (expDate.getMonth() === currentMonth) {
              if (exp.paid_by === user.id) {
                // My actual share is my split amount
                calculatedSpend += mySplit ? Number(mySplit.amount) : 0
              } else if (mySplit) {
                calculatedSpend += Number(mySplit.amount)
              }
            }
          })

          // Calculate settlements in this group
          const groupSettlements = (settlementsData || []).filter((s) => s.group_id === group.id)
          groupSettlements.forEach((sett) => {
            if (sett.payer_id === user.id) {
              balance += Number(sett.amount)
            } else if (sett.payee_id === user.id) {
              balance -= Number(sett.amount)
            }
          })

          if (balance > 0.005) {
            calculatedOwed += balance
          } else if (balance < -0.005) {
            calculatedOwe += Math.abs(balance)
          }

          calculatedBalances.push({
            groupId: group.id,
            groupName: group.name,
            balance: Number(balance.toFixed(2)),
          })
        })

        setTotalOwed(calculatedOwed)
        setTotalOwe(calculatedOwe)
        setMonthlySpend(calculatedSpend)
        setGroupBalances(calculatedBalances)
        setRecentExpenses((expensesData || []).slice(0, 5) as any)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-7xl mx-auto space-y-12">
        {/* HEADER SKELETON */}
        <div className="flex justify-between items-center gap-6">
          <div className="space-y-2.5">
            <div className="h-9 w-48 skeleton rounded-xl"></div>
            <div className="h-4 w-32 skeleton rounded-lg"></div>
          </div>
          <div className="h-10 w-10 skeleton rounded-full"></div>
        </div>

        {/* KPI GRID SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-card p-6 rounded-[28px] h-36 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 skeleton rounded-lg"></div>
                <div className="w-4 h-4 skeleton rounded-full"></div>
              </div>
              <div className="h-8 w-28 skeleton rounded-xl"></div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                <div className="h-full bg-white/10 w-2/3 skeleton"></div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN SKELETON CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="h-6 w-32 skeleton rounded-lg"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card p-5 rounded-3xl h-20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl skeleton"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-36 skeleton rounded-lg"></div>
                      <div className="h-3 w-20 skeleton rounded-md"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 skeleton rounded-lg"></div>
                    <div className="h-3 w-10 skeleton rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="h-6 w-32 skeleton rounded-lg"></div>
            <div className="glass-thick p-6 rounded-[32px] h-[340px] flex flex-col justify-between">
              <div className="space-y-4 flex-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex justify-between items-center py-1">
                    <div className="h-4 w-24 skeleton rounded-lg"></div>
                    <div className="h-4 w-12 skeleton rounded-lg"></div>
                  </div>
                ))}
              </div>
              <div className="h-12 w-full skeleton rounded-2xl"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const userGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-7xl mx-auto space-y-12">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {userGreeting()}, {profile?.full_name.split(' ')[0] || 'User'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Here is your financial overview.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-white/5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your ID:</span>
            <span className="text-xs font-bold mono text-indigo-400">{profile?.split_id}</span>
          </div>
          <Link
            href="/groups"
            className="group w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Create Group"
          >
            <Plus className="w-5 h-5 icon-rotate" />
          </Link>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: You are Owed */}
        <div className="glass-card glass-glow-emerald p-6 rounded-[28px] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">You are Owed</span>
            <TrendingUp className="text-emerald-400 w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-emerald-400">
            {formatCurrency(totalOwed)}
          </div>
          <div className="h-1 bg-emerald-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-2/3"></div>
          </div>
        </div>

        {/* KPI: You Owe */}
        <div className="glass-card glass-glow-rose p-6 rounded-[28px] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">You Owe</span>
            <TrendingDown className="text-rose-400 w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-rose-400">
            {formatCurrency(totalOwe)}
          </div>
          <div className="h-1 bg-rose-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 w-1/3"></div>
          </div>
        </div>

        {/* KPI: Active Groups */}
        <div className="glass-card glass-glow-indigo p-6 rounded-[28px] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Groups</span>
            <Users className="text-indigo-400 w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">{groups.length}</div>
          <p className="text-[10px] text-slate-500 font-medium">Joined and managing spheres</p>
        </div>

        {/* KPI: Monthly Spend */}
        <div className="glass-card glass-glow-indigo p-6 rounded-[28px] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Monthly Spend</span>
            <IndianRupee className="text-purple-400 w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-indigo-400">
            {formatCurrency(monthlySpend)}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Your personal share this month</p>
        </div>
      </div>

      {groups.length === 0 ? (
        /* EMPTY STATE */
        <div className="glass-card rounded-[32px] p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No groups or friends yet</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Start sharing expenses by adding some friends using their Split ID, or create a group to manage trips, dinner tabs, and rent splits.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/groups"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Create a Group
            </Link>
            <Link
              href="/friends"
              className="w-full sm:w-auto px-6 py-3 glass-card rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Friends
            </Link>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD CONTENT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Recent Expenses
              </h3>
            </div>
            
            <div className="space-y-4">
              {recentExpenses.length === 0 ? (
                <div className="glass-card p-10 rounded-[24px] text-center text-slate-400 text-sm">
                  No expenses recorded yet in your groups.
                </div>
              ) : (
                recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="glass-card p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
                        💸
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{exp.title}</h4>
                        <p className="text-xs text-slate-500">
                          Paid by{' '}
                          <span className="text-slate-300 font-semibold">
                            {exp.profiles?.full_name}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(exp.amount))}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(exp.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Group Balances Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Group Balances
              </h3>
            </div>
            
            <div className="glass-thick p-6 rounded-[32px] border-white/5 space-y-6 shadow-xl">
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {groupBalances.map((gb) => (
                  <Link
                    key={gb.groupId}
                    href={`/groups/${gb.groupId}`}
                    className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors block">
                        {gb.groupName}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-extrabold ${
                        gb.balance > 0.005
                          ? 'text-emerald-400'
                          : gb.balance < -0.005
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {gb.balance > 0.005 ? '+' : ''}
                      {formatCurrency(gb.balance)}
                    </span>
                  </Link>
                ))}
              </div>
              
              <Link
                href="/settlements"
                className="w-full py-4 bg-white/5 hover:bg-indigo-600 hover:text-white text-foreground border border-white/5 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner"
              >
                Settle up debts <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
