'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import {
  HandCoins,
  History,
  CheckCircle,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface Member {
  id: string
  full_name: string
}

interface GroupMembersMap {
  [groupId: string]: Member[]
}

interface Settlement {
  id: string
  group_id: string
  payer_id: string
  payee_id: string
  amount: number
  created_at: string
  group_name?: string
  payer_name?: string
  payee_name?: string
}

export default function SettlementsPage() {
  const toast = useToast()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMembers, setGroupMembers] = useState<GroupMembersMap>({})
  const [loading, setLoading] = useState(true)

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [payerId, setPayerId] = useState('')
  const [payeeId, setPayeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [myId, setMyId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadSettlementsData()
  }, [])

  // Load group members when selected group changes in form
  useEffect(() => {
    if (!selectedGroupId || groupMembers[selectedGroupId]) return
    
    async function loadMembersForGroup() {
      try {
        const { data: gmData } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedGroupId)

        if (!gmData) return

        const userIds = gmData.map(gm => gm.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        if (profiles) {
          setGroupMembers(prev => ({
            ...prev,
            [selectedGroupId]: profiles,
          }))
        }
      } catch (err) {
        console.error('Error loading group members:', err)
      }
    }

    loadMembersForGroup()
  }, [selectedGroupId])

  async function loadSettlementsData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyId(user.id)

      // 1. Fetch groups I am in
      const { data: gmData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (!gmData || gmData.length === 0) {
        setLoading(false)
        return
      }

      const groupIds = gmData.map(gm => gm.group_id)

      // Fetch group names
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)
      setGroups(groupsData || [])

      // 2. Fetch settlements in these groups
      const { data: setts } = await supabase
        .from('settlements')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })

      if (!setts || setts.length === 0) {
        setSettlements([])
        setLoading(false)
        return
      }

      // Collect all unique profile IDs from settlements
      const profileIds = Array.from(
        new Set([
          ...setts.map(s => s.payer_id),
          ...setts.map(s => s.payee_id),
        ])
      )

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)

      // Map profiles and group names
      const mapped = setts.map(s => {
        const group = groupsData?.find(g => g.id === s.group_id)
        const payer = profiles?.find(p => p.id === s.payer_id)
        const payee = profiles?.find(p => p.id === s.payee_id)

        return {
          ...s,
          group_name: group ? group.name : 'Unknown Group',
          payer_name: payer ? payer.full_name : 'Unknown User',
          payee_name: payee ? payee.full_name : 'Unknown User',
        }
      })

      setSettlements(mapped)

    } catch (err) {
      console.error('Error loading settlements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number(amount)
    if (!selectedGroupId || !payerId || !payeeId || isNaN(amountNum) || amountNum <= 0) {
      setError('Please fill in all details with a valid amount.')
      return
    }

    if (payerId === payeeId) {
      setError('Payer and Recipient cannot be the same person.')
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const { error: insertErr } = await supabase.rpc('create_settlement_transaction', {
        p_group_id: selectedGroupId,
        p_payer_id: payerId,
        p_payee_id: payeeId,
        p_amount: amountNum,
        p_performed_by: myId,
      })

      if (insertErr) throw insertErr

      toast.success('Settlement recorded successfully!')
      setIsModalOpen(false)
      setSelectedGroupId('')
      setPayerId('')
      setPayeeId('')
      setAmount('')
      loadSettlementsData()
    } catch (err: any) {
      console.error('Error creating settlement:', err)
      setError(err.message || 'Failed to record settlement.')
      toast.error(err.message || 'Failed to record settlement.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-9 w-60 skeleton rounded-xl"></div>
            <div className="h-4 w-72 skeleton rounded-lg"></div>
          </div>
        </header>
        <div className="glass-thick p-6 rounded-[32px] border-white/5 shadow-2xl space-y-6 animate-pulse">
          <div className="h-5 w-48 skeleton rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card p-5 rounded-2xl h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 skeleton rounded-xl"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 skeleton rounded-md"></div>
                    <div className="h-3 w-20 skeleton rounded-md"></div>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                  <div className="h-4 w-16 skeleton rounded-md"></div>
                  <div className="h-3 w-24 skeleton rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Settlements Ledger</h2>
          <p className="text-slate-400 text-sm mt-1">Audit historic settlements or record a new payment.</p>
        </div>

        {groups.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02]"
          >
            <Plus className="w-4.5 h-4.5" /> Record Settlement
          </button>
        )}
      </header>

      {/* SETTLEMENTS LEDGER LIST */}
      {settlements.length === 0 ? (
        <div className="glass-card rounded-[32px] p-16 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <HandCoins className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No settlements recorded</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Balances between friends or group members will show up here once you record settle-up payments inside group details.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-thick p-6 rounded-[32px] border-white/5 shadow-2xl space-y-6">
          <h3 className="font-bold text-base flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-indigo-400" /> Historic Ledger Logs
          </h3>

          <div className="space-y-3">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {s.payer_name} <span className="text-xs text-slate-500 font-normal">paid</span> {s.payee_name}
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
                      {s.group_name}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-white/5 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatCurrency(Number(s.amount))}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORD SETTLEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md glass-thick rounded-[40px] border-white/10 p-8 space-y-6 shadow-2xl animate-modal-entry">
            <header className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Record Settlement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </header>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSettlement} className="space-y-4">
              {/* Select Group */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Sphere</label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value)
                    setPayerId('')
                    setPayeeId('')
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                >
                  <option value="">Which group is this for?</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Payer */}
              {selectedGroupId && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payer (Who is sending money)</label>
                  <select
                    required
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                  >
                    <option value="">Who is sending the payment?</option>
                    {groupMembers[selectedGroupId]?.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Payee */}
              {selectedGroupId && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payee (Who is receiving money)</label>
                  <select
                    required
                    value={payeeId}
                    onChange={(e) => setPayeeId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium text-white"
                  >
                    <option value="">Who is receiving the payment?</option>
                    {groupMembers[selectedGroupId]?.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {payerId && payeeId && payerId !== payeeId && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl text-[11px] text-indigo-300 leading-relaxed space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[9px] text-indigo-400">💡 Settlement Meaning:</span>
                  <span>
                    <strong>{groupMembers[selectedGroupId]?.find(m => m.id === payerId)?.full_name}</strong> is paying <strong>{groupMembers[selectedGroupId]?.find(m => m.id === payeeId)?.full_name}</strong> {amount ? `₹${amount}` : 'money'}.
                  </span>
                  <span className="block text-slate-400">
                    This will decrease <strong>{groupMembers[selectedGroupId]?.find(m => m.id === payerId)?.full_name}</strong>'s net debt and decrease the credit owed to <strong>{groupMembers[selectedGroupId]?.find(m => m.id === payeeId)?.full_name}</strong>.
                  </span>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Settlement Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Settlement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
