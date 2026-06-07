'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getAvatarFallback } from '@/lib/utils'
import { simplifyDebts, MemberBalance } from '@/lib/debt-simplifier'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  created_by: string
}

interface Member {
  id: string
  full_name: string
  split_id: string
  email: string
}

interface Expense {
  id: string
  title: string
  amount: number
  paid_by: string
  split_type: string
  receipt_url?: string
  created_at: string
  payer_name?: string
  splits: {
    user_id: string
    amount: number
    percentage?: number
  }[]
}

interface Settlement {
  id: string
  payer_id: string
  payee_id: string
  amount: number
  created_at: string
  payer_name?: string
  payee_name?: string
}

export default function GroupDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const toast = useToast()
  const params = use(paramsPromise)
  const groupId = params.id
  const router = useRouter()
  const supabase = createClient()

  const [myId, setMyId] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)

  // Calculations
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([])
  const [simplifiedTransactions, setSimplifiedTransactions] = useState<any[]>([])

  // Modal controls
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)

  // Form State: Add Member
  const [inviteSplitId, setInviteSplitId] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Form State: Add Expense
  const [expTitle, setExpTitle] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expPaidBy, setExpPaidBy] = useState('')
  const [expSplitType, setExpSplitType] = useState<'equal' | 'percentage' | 'exact'>('equal')
  const [expSplits, setExpSplits] = useState<{ [userId: string]: string }>({}) // percentage or exact amount input
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [expenseLoading, setExpenseLoading] = useState(false)

  // Form State: Settle
  const [settlePayer, setSettlePayer] = useState('')
  const [settlePayee, setSettlePayee] = useState('')
  const [settleAmount, setSettleAmount] = useState('')
  const [settleLoading, setSettleLoading] = useState(false)
  const [settleError, setSettleError] = useState<string | null>(null)

  useEffect(() => {
    loadGroupData()
  }, [groupId])

  async function loadGroupData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyId(user.id)

      // 1. Fetch Group Details
      const { data: groupData, error: gErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (gErr) {
        router.push('/dashboard')
        return
      }
      setGroup(groupData)

      // 2. Fetch Members
      const { data: gmData } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

      const memberIds = (gmData || []).map((gm) => gm.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds)
      setMembers(profiles || [])

      // 3. Fetch Expenses & Splits (Active only)
      const { data: expData } = await supabase
        .from('expenses')
        .select('*, expense_splits(*)')
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // 4. Fetch Settlements
      const { data: setts } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      // 5. Fetch Materialized Balances
      const { data: balancesData } = await supabase
        .from('group_balances')
        .select('*')
        .eq('group_id', groupId)

      const mappedExpenses = (expData || []).map((exp) => {
        const payer = profiles?.find((p) => p.id === exp.paid_by)
        return {
          ...exp,
          payer_name: payer ? payer.full_name : 'Unknown',
          splits: exp.expense_splits || [],
        }
      })
      setExpenses(mappedExpenses)

      const mappedSettlements = (setts || []).map((s) => {
        const payer = profiles?.find((p) => p.id === s.payer_id)
        const payee = profiles?.find((p) => p.id === s.payee_id)
        return {
          ...s,
          payer_name: payer ? payer.full_name : 'Unknown',
          payee_name: payee ? payee.full_name : 'Unknown',
        }
      })
      setSettlements(mappedSettlements)

      // Map net balances from cached table
      const listBalances = (profiles || []).map((p) => {
        const cached = balancesData?.find((b) => b.user_id === p.id)
        return {
          id: p.id,
          name: p.full_name,
          split_id: p.split_id,
          balance: cached ? Number(cached.net_balance) : 0.00,
        }
      })

      setMemberBalances(listBalances)
      setSimplifiedTransactions(simplifyDebts(listBalances))

    } catch (err) {
      console.error('Error fetching group data:', err)
    } finally {
      setLoading(false)
    }
  }

  function calculateBalances(
    groupMembers: Member[],
    groupExpenses: Expense[],
    groupSettlements: any[],
    currentUserId: string
  ) {
    const balancesMap: { [userId: string]: number } = {}
    groupMembers.forEach((m) => {
      balancesMap[m.id] = 0
    })

    // Process expenses
    groupExpenses.forEach((exp) => {
      // Add paid amount to payer
      if (balancesMap[exp.paid_by] !== undefined) {
        balancesMap[exp.paid_by] += Number(exp.amount)
      }
      // Deduct shares from split users
      exp.splits.forEach((split) => {
        if (balancesMap[split.user_id] !== undefined) {
          balancesMap[split.user_id] -= Number(split.amount)
        }
      })
    })

    // Process settlements
    groupSettlements.forEach((sett) => {
      if (balancesMap[sett.payer_id] !== undefined) {
        balancesMap[sett.payer_id] += Number(sett.amount)
      }
      if (balancesMap[sett.payee_id] !== undefined) {
        balancesMap[sett.payee_id] -= Number(sett.amount)
      }
    })

    const listBalances: MemberBalance[] = groupMembers.map((m) => ({
      id: m.id,
      name: m.full_name,
      split_id: m.split_id,
      balance: Number(balancesMap[m.id].toFixed(2)),
    }))

    setMemberBalances(listBalances)
    setSimplifiedTransactions(simplifyDebts(listBalances))
  }

  // Invite Member Flow
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteSplitId.trim()) return
    setInviteLoading(true)
    setInviteError(null)

    try {
      const splitId = inviteSplitId.trim().toUpperCase()

      // Find profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('split_id', splitId)
        .maybeSingle()

      if (!profile) {
        setInviteError('No user found with this Split ID.')
        setInviteLoading(false)
        return
      }

      // Check if already in group
      if (members.some((m) => m.id === profile.id)) {
        setInviteError('User is already a member of this group.')
        setInviteLoading(false)
        return
      }

      // Verify friendship status is 'accepted'
      if (myId) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status')
          .or(`user_id.eq.${myId},friend_id.eq.${myId}`)
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
          .eq('status', 'accepted')
          .maybeSingle()

        if (!friendship) {
          setInviteError('You can only invite active friends. Send them a friend request first!')
          setInviteLoading(false)
          return
        }
      }

      // Add to group
      const { error: insertErr } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: profile.id,
        })

      if (insertErr) throw insertErr

      setMembers((prev) => [...prev, profile])
      setInviteSplitId('')
      setIsAddMemberModalOpen(false)
      
      // Refresh data
      loadGroupData()
      toast.success(`${profile.full_name} has been added to this group.`)
    } catch (err: any) {
      setInviteError(err.message || 'Failed to add member.')
      toast.error(err.message || 'Failed to add member.')
    } finally {
      setInviteLoading(false)
    }
  }

  // Pre-fill Splits inputs based on strategy
  useEffect(() => {
    if (!isExpenseModalOpen) return
    const initialSplits: { [userId: string]: string } = {}
    if (expSplitType === 'percentage') {
      members.forEach((m) => {
        initialSplits[m.id] = (100 / members.length).toFixed(1)
      })
    } else if (expSplitType === 'exact') {
      const perUser = Number(expAmount) / members.length
      members.forEach((m) => {
        initialSplits[m.id] = perUser ? perUser.toFixed(2) : '0'
      })
    }
    setExpSplits(initialSplits)
  }, [expSplitType, isExpenseModalOpen])

  // Default paid_by to current user when opening the expense modal
  useEffect(() => {
    if (isExpenseModalOpen && myId && !expPaidBy) {
      setExpPaidBy(myId)
    }
  }, [isExpenseModalOpen, myId, expPaidBy])

  // Handle Create Expense Submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number(expAmount)
    if (!expTitle.trim() || isNaN(amountNum) || amountNum <= 0 || !expPaidBy) {
      setExpenseError('Please enter a valid title, amount and payer.')
      return
    }

    setExpenseLoading(true)
    setExpenseError(null)

    try {
      let receiptUrl = null

      // Upload receipt to Supabase Storage if selected
      if (receiptFile) {
        setUploadingReceipt(true)
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${groupId}-${Date.now()}.${fileExt}`
        const filePath = `receipts/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile)

        if (uploadError) {
          throw new Error('Failed to upload receipt file to storage.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)
        
        receiptUrl = publicUrl
        setUploadingReceipt(false)
      }

      // Check split strategies rules
      const calculatedSplits: { user_id: string; amount: number; percentage?: number }[] = []

      if (expSplitType === 'equal') {
        const splitAmt = Number((amountNum / members.length).toFixed(2))
        // adjust last split for decimal rounding
        let totalAssigned = 0
        members.forEach((m, idx) => {
          const isLast = idx === members.length - 1
          const amt = isLast ? Number((amountNum - totalAssigned).toFixed(2)) : splitAmt
          totalAssigned += amt
          calculatedSplits.push({ user_id: m.id, amount: amt })
        })
      } else if (expSplitType === 'percentage') {
        let pctSum = 0
        members.forEach((m) => {
          pctSum += Number(expSplits[m.id] || 0)
        })

        if (Math.abs(pctSum - 100) > 0.1) {
          throw new Error('Total percentages must sum to 100%.')
        }

        members.forEach((m) => {
          const pct = Number(expSplits[m.id] || 0)
          const amt = Number(((amountNum * pct) / 100).toFixed(2))
          calculatedSplits.push({ user_id: m.id, amount: amt, percentage: pct })
        })
      } else {
        // exact amounts
        let sumAmt = 0
        members.forEach((m) => {
          sumAmt += Number(expSplits[m.id] || 0)
        })

        if (Math.abs(sumAmt - amountNum) > 0.05) {
          throw new Error(`Total split amounts (${formatCurrency(sumAmt)}) must sum exactly to the expense amount (${formatCurrency(amountNum)})`)
        }

        members.forEach((m) => {
          calculatedSplits.push({ user_id: m.id, amount: Number(expSplits[m.id] || 0) })
        })
      }

      // Call atomic transaction RPC
      const { data: expenseId, error: expErr } = await supabase
        .rpc('create_expense_transaction', {
          p_group_id: groupId,
          p_paid_by: expPaidBy,
          p_title: expTitle.trim(),
          p_amount: amountNum,
          p_split_type: expSplitType,
          p_splits: calculatedSplits.map((split) => ({
            user_id: split.user_id,
            amount: split.amount,
            percentage: split.percentage || null,
          })),
          p_receipt_url: receiptUrl,
          p_performed_by: myId,
        })

      if (expErr) throw expErr

      // Reset & Reload
      setExpTitle('')
      setExpAmount('')
      setReceiptFile(null)
      setIsExpenseModalOpen(false)
      loadGroupData()
      toast.success(`Expense "${expTitle.trim()}" added successfully!`)
    } catch (err: any) {
      setExpenseError(err.message || 'Failed to add expense.')
      toast.error(err.message || 'Failed to add expense.')
    } finally {
      setExpenseLoading(false)
    }
  }

  // Record Settlement Submission
  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number(settleAmount)
    if (!settlePayer || !settlePayee || isNaN(amountNum) || amountNum <= 0) {
      setSettleError('Please select valid payer, payee and amount.')
      return
    }

    if (settlePayer === settlePayee) {
      setSettleError('Payer and Recipient cannot be the same person.')
      return
    }

    setSettleLoading(true)
    setSettleError(null)

    try {
      const { error } = await supabase.rpc('create_settlement_transaction', {
        p_group_id: groupId,
        p_payer_id: settlePayer,
        p_payee_id: settlePayee,
        p_amount: amountNum,
        p_performed_by: myId,
      })

      if (error) throw error

      const payerName = members.find(m => m.id === settlePayer)?.full_name || 'Member'
      const payeeName = members.find(m => m.id === settlePayee)?.full_name || 'Member'
      toast.success(`Settlement of ${formatCurrency(amountNum)} from ${payerName} to ${payeeName} recorded successfully!`)

      setSettleAmount('')
      setIsSettleModalOpen(false)
      loadGroupData()
    } catch (err: any) {
      setSettleError(err.message || 'Failed to record settlement.')
      toast.error(err.message || 'Failed to record settlement.')
    } finally {
      setSettleLoading(false)
    }
  }

  // Pre-fill Settle form from a suggested transaction card
  const handleQuickSettle = (fromId: string, toId: string, amount: number) => {
    setSettlePayer(fromId)
    setSettlePayee(toId)
    setSettleAmount(amount.toString())
    setIsSettleModalOpen(true)
  }

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const { error } = await supabase.rpc('delete_expense_transaction', {
        p_expense_id: id,
        p_performed_by: myId,
      })
      if (error) throw error
      loadGroupData()
      toast.success('Expense deleted successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete expense.')
    }
  }

  if (loading) {
    return (
      <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-7xl mx-auto space-y-12">
        {/* HEADER BAR SKELETON */}
        <div className="flex flex-col gap-6">
          <div className="h-4 w-24 skeleton rounded-md"></div>
          <div className="flex justify-between items-center gap-6">
            <div className="space-y-2">
              <div className="h-9 w-60 skeleton rounded-xl"></div>
              <div className="h-4 w-40 skeleton rounded-lg"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-32 skeleton rounded-2xl"></div>
              <div className="h-12 w-28 skeleton rounded-2xl"></div>
            </div>
          </div>
        </div>
        {/* KPI GRID & SMART SIMPLIFICATION SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-thick p-6 rounded-[32px] h-[320px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-4 w-28 skeleton rounded-md"></div>
                <div className="h-10 w-44 skeleton rounded-xl"></div>
                <div className="h-3 w-full skeleton rounded-md"></div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex justify-between items-center py-1">
                    <div className="h-4 w-20 skeleton rounded-md"></div>
                    <div className="h-4 w-12 skeleton rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-thick p-6 rounded-[32px] h-[320px] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 w-44 skeleton rounded-md"></div>
                <div className="h-3.5 w-80 skeleton rounded-md"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 pt-6">
                {[1, 2].map((n) => (
                  <div key={n} className="glass-card p-4.5 rounded-2xl h-28 flex flex-col justify-between">
                    <div className="h-3 w-16 skeleton rounded-md"></div>
                    <div className="h-4 w-28 skeleton rounded-md"></div>
                    <div className="h-4 w-12 skeleton rounded-md self-end"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const myBalanceInGroup = memberBalances.find((m) => m.id === myId)?.balance || 0

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-7xl mx-auto space-y-12">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Spheres
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{group?.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{group?.description || 'Social coordinate sphere.'}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
            <button
              onClick={() => {
                if (myBalanceInGroup < -0.005) {
                  setSettlePayer(myId || '')
                  setSettlePayee('')
                } else if (myBalanceInGroup > 0.005) {
                  setSettlePayer('')
                  setSettlePayee(myId || '')
                } else {
                  setSettlePayer('')
                  setSettlePayee('')
                }
                setSettleAmount('')
                setIsSettleModalOpen(true)
              }}
              className="flex-1 md:flex-none px-6 py-3 glass-card text-foreground rounded-2xl text-xs font-bold transition-all hover:bg-white/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Settle Up
            </button>
          </div>
        </div>
      </div>

      {/* KPI GRID & SMART SIMPLIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Balances Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-thick p-6 rounded-[32px] border-white/5 space-y-6 shadow-xl">
            <h3 className="font-bold text-base">Your balance</h3>
            <div className="space-y-2">
              <div
                className={`text-4xl font-black tracking-tight ${
                  myBalanceInGroup > 0.005
                    ? 'text-emerald-400'
                    : myBalanceInGroup < -0.005
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {myBalanceInGroup > 0.005 ? '+' : ''}
                {formatCurrency(myBalanceInGroup)}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {myBalanceInGroup > 0.005
                  ? 'Other members owe you money in this group.'
                  : myBalanceInGroup < -0.005
                  ? 'You owe money to other members in this group.'
                  : 'You are completely settled up!'}
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                <span>Member</span>
                <span>Net Balance</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {memberBalances.map((mb) => (
                  <div key={mb.id} className="flex justify-between items-center p-2 rounded-xl bg-white/5 text-xs font-semibold">
                    <span className="text-slate-300">{mb.name}</span>
                    <span
                      className={
                        mb.balance > 0.005
                          ? 'text-emerald-400'
                          : mb.balance < -0.005
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {mb.balance > 0.005 ? '+' : ''}
                      {formatCurrency(mb.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {group?.created_by === myId && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/5 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4 text-indigo-400" /> Manage Group Members
              </button>
            )}
          </div>
        </div>

        {/* Smart Debt Simplification */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-thick p-6 rounded-[32px] border-white/5 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl"></div>
            
            <header className="flex justify-between items-center px-1">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Smart Debt Simplifier
              </h3>
              <span className="text-[10px] bg-indigo-600/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/25">
                ACTIVE
              </span>
            </header>

            <p className="text-xs text-slate-400 leading-relaxed px-1">
              SplitID automatically minimizes transactions within this group. Click any suggestion below to instantly settle the balance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {simplifiedTransactions.length === 0 ? (
                <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm font-medium">
                  Everyone is fully settled. No transactions required!
                </div>
              ) : (
                simplifiedTransactions.map((tx, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleQuickSettle(tx.fromId, tx.toId, tx.amount)}
                    className="glass-card p-4.5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 cursor-pointer group active:scale-98"
                  >
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold tracking-widest uppercase">
                      <span>Payer</span>
                      <span>Recipient</span>
                    </div>

                    <div className="flex justify-between items-center my-3">
                      <div className="text-sm font-bold text-foreground truncate max-w-[100px]">{tx.fromName}</div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      <div className="text-sm font-bold text-foreground truncate max-w-[100px]">{tx.toName}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 mono">{tx.fromSplitId}</span>
                      <span className="text-sm font-extrabold text-indigo-400">{formatCurrency(tx.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EXPENSE HISTORY & SETTLEMENT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Expenses List */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" /> Expense Stream
          </h3>

          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="glass-card p-12 rounded-[28px] text-center text-slate-500 text-sm">
                No expenses logged yet. Add one above!
              </div>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="glass-card p-5 rounded-[24px] space-y-4 hover:border-white/10 group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/5">
                        🍽️
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground">{exp.title}</h4>
                        <p className="text-xs text-slate-500">
                          Paid by <span className="text-slate-300 font-semibold">{exp.payer_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-foreground">{formatCurrency(Number(exp.amount))}</div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                          {new Date(exp.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {(() => {
                          const mySplit = exp.splits.find(s => s.user_id === myId)
                          const myShare = mySplit ? Number(mySplit.amount) : 0
                          
                          if (exp.paid_by === myId) {
                            const othersShare = Number(exp.amount) - myShare
                            if (othersShare > 0.005) {
                              return (
                                <div className="text-[10px] font-bold text-emerald-400 mt-1">
                                  you lent {formatCurrency(othersShare)}
                                </div>
                              )
                            } else {
                              return (
                                <div className="text-[10px] font-bold text-slate-400 mt-1">
                                  you paid (sole share)
                                </div>
                              )
                            }
                          } else {
                            if (myShare > 0.005) {
                              return (
                                <div className="text-[10px] font-bold text-rose-400 mt-1">
                                  you owe {exp.payer_name?.split(' ')[0]} {formatCurrency(myShare)}
                                </div>
                              )
                            } else {
                              return (
                                <div className="text-[10px] font-bold text-slate-500 mt-1">
                                  not involved
                                </div>
                              )
                            }
                          }
                        })()}
                      </div>
                      
                      {exp.paid_by === myId && (
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Splits Breakdown */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap gap-4 text-xs font-semibold">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold block w-full">
                      Share Breakdown
                    </span>
                    {exp.splits.map((split) => {
                      const memberName = members.find((m) => m.id === split.user_id)?.full_name || 'Member'
                      return (
                        <div key={split.user_id} className="bg-white/5 px-3 py-1.5 rounded-full text-[11px] text-slate-300">
                          {memberName}: <span className="font-bold text-indigo-400">{formatCurrency(Number(split.amount))}</span>
                          {split.percentage && ` (${split.percentage}%)`}
                        </div>
                      )
                    })}
                  </div>

                  {/* Receipt Preview */}
                  {exp.receipt_url && (
                    <div className="pt-3.5 border-t border-white/5">
                      <a
                        href={exp.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Attached Receipt
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settlements Log */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400" /> Settle Logs
          </h3>

          <div className="glass-thick p-5 rounded-[32px] border-white/5 space-y-4 shadow-xl">
            {settlements.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6">No settlements recorded yet.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {settlements.map((s) => (
                  <div key={s.id} className="p-3 bg-white/5 rounded-2xl space-y-1.5 border border-white/5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[80px]">{s.payer_name}</span>
                      <span className="text-[10px] text-slate-500 lowercase tracking-tight">paid</span>
                      <span className="text-slate-300 truncate max-w-[80px]">{s.payee_name}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {new Date(s.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">{formatCurrency(Number(s.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Add Member */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-md" onClick={() => setIsAddMemberModalOpen(false)}></div>
          <div className="relative w-full max-w-md glass-thick rounded-[40px] border-white/10 p-8 space-y-6 shadow-2xl animate-modal-entry">
            <header className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Add Group Member</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </header>

            {inviteError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Member Split ID</label>
                <input
                  type="text"
                  required
                  value={inviteSplitId}
                  onChange={(e) => setInviteSplitId(e.target.value)}
                  placeholder="e.g. SPX-84A9KD"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Settle Up */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-md" onClick={() => setIsSettleModalOpen(false)}></div>
          <div className="relative w-full max-w-md glass-thick rounded-[40px] border-white/10 p-8 space-y-6 shadow-2xl animate-modal-entry">
            <header className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Record Settlement</h3>
              <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </header>

            {settleError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {settleError}
              </div>
            )}

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payer (Who is sending money)</label>
                <select
                  required
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                >
                  <option value="">Who is sending the payment?</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payee (Who is receiving money)</label>
                <select
                  required
                  value={settlePayee}
                  onChange={(e) => setSettlePayee(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                >
                  <option value="">Who is receiving the payment?</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {settlePayer && settlePayee && settlePayer !== settlePayee && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl text-[11px] text-indigo-300 leading-relaxed space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[9px] text-indigo-400">💡 Settlement Meaning:</span>
                  <span>
                    <strong>{members.find(m => m.id === settlePayer)?.full_name}</strong> is paying <strong>{members.find(m => m.id === settlePayee)?.full_name}</strong> {settleAmount ? `₹${settleAmount}` : 'money'}.
                  </span>
                  <span className="block text-slate-400">
                    This will decrease <strong>{members.find(m => m.id === settlePayer)?.full_name}</strong>'s net debt and decrease the credit owed to <strong>{members.find(m => m.id === settlePayee)?.full_name}</strong>.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Settlement Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={settleLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {settleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Settlement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-md" onClick={() => setIsExpenseModalOpen(false)}></div>
          <div className="relative w-full max-w-xl glass-thick rounded-[40px] border-white/10 p-8 md:p-10 space-y-6 shadow-2xl animate-modal-entry max-h-[90vh] overflow-y-auto">
            <header className="flex justify-between items-center">
              <h3 className="text-2xl font-bold tracking-tight">New Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </header>

            {expenseError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Sushi dinner, Cabin booking"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Paid By</label>
                  <select
                    required
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                  >
                    <option value="">Select Payer</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Strategy Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Split Strategy</label>
                <div className="flex gap-2 p-1.5 glass-card rounded-2xl border-white/5">
                  {(['equal', 'percentage', 'exact'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setExpSplitType(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        expSplitType === type
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split inputs breakdown */}
              <div className="space-y-3 p-4 border border-white/5 rounded-2xl bg-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Split Breakdown
                  </span>
                  {expSplitType === 'percentage' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      Math.abs(members.reduce((acc, m) => acc + Number(expSplits[m.id] || 0), 0) - 100) < 0.1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      Total: {members.reduce((acc, m) => acc + Number(expSplits[m.id] || 0), 0).toFixed(1)}% / 100%
                    </span>
                  )}
                  {expSplitType === 'exact' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      Math.abs(members.reduce((acc, m) => acc + Number(expSplits[m.id] || 0), 0) - Number(expAmount || 0)) < 0.05
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      Allocated: ₹{members.reduce((acc, m) => acc + Number(expSplits[m.id] || 0), 0).toFixed(2)} / ₹{Number(expAmount || 0).toFixed(2)}
                    </span>
                  )}
                  {expSplitType === 'equal' && (
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      Split Equally (₹{(Number(expAmount || 0) / members.length).toFixed(2)} each)
                    </span>
                  )}
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => {
                    let calculatedShare = 0
                    const amountNum = Number(expAmount || 0)
                    if (expSplitType === 'equal') {
                      calculatedShare = amountNum / members.length
                    } else if (expSplitType === 'percentage') {
                      const pct = Number(expSplits[m.id] || 0)
                      calculatedShare = (amountNum * pct) / 100
                    } else {
                      calculatedShare = Number(expSplits[m.id] || 0)
                    }

                    return (
                      <div key={m.id} className="flex items-center justify-between gap-4 text-xs font-semibold py-1">
                        <span className="text-slate-300 truncate max-w-[150px]">{m.full_name}</span>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-400 font-bold text-xs">
                            ₹{calculatedShare.toFixed(2)}
                          </span>

                          {expSplitType === 'percentage' && (
                            <div className="relative w-24">
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">%</span>
                              <input
                                type="number"
                                step="any"
                                required
                                value={expSplits[m.id] || ''}
                                onChange={(e) =>
                                  setExpSplits({ ...expSplits, [m.id]: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors text-right pr-7 text-[11px]"
                              />
                            </div>
                          )}

                          {expSplitType === 'exact' && (
                            <div className="relative w-24">
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">₹</span>
                              <input
                                type="number"
                                step="any"
                                required
                                value={expSplits[m.id] || ''}
                                onChange={(e) =>
                                  setExpSplits({ ...expSplits, [m.id]: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors text-right pr-7 text-[11px]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Receipt File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Receipt Attachment</label>
                <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 hover:border-indigo-500/50 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReceiptFile(e.target.files[0])
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-bold">
                    {receiptFile ? receiptFile.name : 'Attach Receipt Image or PDF'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts images and PDF files (Max 5MB)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={expenseLoading}
                className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {expenseLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Recording Expense...
                  </>
                ) : (
                  'Create Expense'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
