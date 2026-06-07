'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarFallback } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Check,
  X,
  Loader2,
  Users,
  AlertCircle
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  split_id: string
  avatar_url?: string
  email: string
}

interface FriendshipWithProfile {
  friendProfile: Profile
  status: 'pending' | 'accepted' | 'rejected'
  requesterId: string
}

export default function FriendsPage() {
  const toast = useToast()
  const [myId, setMyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<Profile | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchStatus, setSearchStatus] = useState<string | null>(null) // 'none', 'self', 'friend', 'pending_sent', 'pending_received'
  
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadFriends() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setMyId(user.id)

        // 1. Fetch friendships where I am involved
        const { data: fships } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

        if (!fships || fships.length === 0) {
          setFriends([])
          return
        }

        // 2. Extract friend IDs
        const friendIds = fships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))

        // 3. Fetch friend profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds)

        // 4. Map them together
        const mappedFriends = fships.map((f) => {
          const friendProfile = profiles?.find(
            (p) => p.id === (f.user_id === user.id ? f.friend_id : f.user_id)
          )!
          return {
            friendProfile,
            status: f.status as any,
            requesterId: f.requester_id,
          }
        }).filter(f => f.friendProfile !== undefined) // safety filter

        setFriends(mappedFriends)
      } catch (err) {
        console.error('Error loading friends:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFriends()
  }, [])

  // Search by Split ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !myId) return
    setSearchLoading(true)
    setSearchResult(null)
    setSearchStatus(null)

    try {
      const formattedQuery = searchQuery.trim().toUpperCase()

      // 1. Find profile matching Split ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('split_id', formattedQuery)
        .maybeSingle()

      if (!profile) {
        setSearchResult(null)
        setSearchLoading(false)
        toast.error(`No user found matching Split ID "${formattedQuery}"`)
        return
      }

      setSearchResult(profile)
      toast.success(`User "${profile.full_name}" found!`)

      if (profile.id === myId) {
        setSearchStatus('self')
        setSearchLoading(false)
        return
      }

      // Check current friendship status
      const existing = friends.find((f) => f.friendProfile.id === profile.id)
      if (existing) {
        if (existing.status === 'accepted') {
          setSearchStatus('friend')
        } else if (existing.status === 'pending') {
          if (existing.requesterId === myId) {
            setSearchStatus('pending_sent')
          } else {
            setSearchStatus('pending_received')
          }
        }
      } else {
        setSearchStatus('none')
      }
    } catch (err) {
      console.error('Error searching user:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Send Friend Request
  const sendFriendRequest = async (friendId: string) => {
    if (!myId) return
    setActionLoading(friendId)

    try {
      // Order UUIDs to enforce user_id < friend_id
      const [uId, fId] = [myId, friendId].sort()

      const { error } = await supabase.from('friendships').insert({
        user_id: uId,
        friend_id: fId,
        status: 'pending',
        requester_id: myId,
      })

      if (error) throw error

      // Update state
      const { data: newFriendProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single()

      if (newFriendProfile) {
        const newFriendship: FriendshipWithProfile = {
          friendProfile: newFriendProfile,
          status: 'pending',
          requesterId: myId,
        }
        setFriends((prev) => [...prev, newFriendship])
        setSearchStatus('pending_sent')
        toast.success(`Friend request sent to ${newFriendProfile.full_name}!`)
      }
    } catch (err) {
      console.error('Error sending friend request:', err)
      toast.error('Failed to send friend request.')
    } finally {
      setActionLoading(null)
    }
  }

  // Accept Friend Request
  const acceptFriendRequest = async (friendId: string) => {
    if (!myId) return
    setActionLoading(friendId)

    try {
      const [uId, fId] = [myId, friendId].sort()

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', uId)
        .eq('friend_id', fId)

      if (error) throw error

      setFriends((prev) =>
        prev.map((f) =>
          f.friendProfile.id === friendId ? { ...f, status: 'accepted' } : f
        )
      )
      
      const friendName = friends.find((f) => f.friendProfile.id === friendId)?.friendProfile.full_name || 'User'
      toast.success(`Friend request from ${friendName} accepted!`)

      if (searchResult?.id === friendId) {
        setSearchStatus('friend')
      }
    } catch (err) {
      console.error('Error accepting request:', err)
      toast.error('Failed to accept friend request.')
    } finally {
      setActionLoading(null)
    }
  }

  // Reject / Cancel Friend Request
  const rejectFriendRequest = async (friendId: string) => {
    if (!myId) return
    setActionLoading(friendId)

    try {
      const [uId, fId] = [myId, friendId].sort()

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', uId)
        .eq('friend_id', fId)

      if (error) throw error

      setFriends((prev) => prev.filter((f) => f.friendProfile.id !== friendId))
      toast.success('Friendship or request removed successfully.')
      
      if (searchResult?.id === friendId) {
        setSearchStatus('none')
      }
    } catch (err) {
      console.error('Error removing friendship:', err)
      toast.error('Failed to remove request or friend.')
    } finally {
      setActionLoading(null)
    }
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted')
  const incomingRequests = friends.filter((f) => f.status === 'pending' && f.requesterId !== myId)
  const outgoingRequests = friends.filter((f) => f.status === 'pending' && f.requesterId === myId)

  if (loading) {
    return (
      <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-6xl mx-auto space-y-12">
        <header className="space-y-2">
          <div className="h-9 w-48 skeleton rounded-xl animate-pulse"></div>
          <div className="h-4 w-60 skeleton rounded-lg animate-pulse"></div>
        </header>
        {/* SEARCH CARD SKELETON */}
        <div className="glass-thick p-6 rounded-[28px] h-36 flex flex-col justify-between animate-pulse">
          <div className="h-4 w-28 skeleton rounded-md"></div>
          <div className="flex gap-4">
            <div className="h-12 flex-1 skeleton rounded-2xl"></div>
            <div className="h-12 w-28 skeleton rounded-2xl"></div>
          </div>
        </div>
        {/* ACTIVE FRIENDS SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-6 w-36 skeleton rounded-lg animate-pulse"></div>
            {[1, 2].map((n) => (
              <div key={n} className="glass-card p-4 rounded-2xl h-16 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg skeleton"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-20 skeleton rounded-md"></div>
                    <div className="h-2.5 w-16 skeleton rounded-md"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-6 w-40 skeleton rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card p-5 rounded-2xl h-20 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl skeleton"></div>
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 skeleton rounded-md"></div>
                      <div className="h-3 w-16 skeleton rounded-md"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-6xl mx-auto space-y-12">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">Friends Hub</h2>
        <p className="text-slate-400 text-sm mt-1">Connect with friends using their unique Split IDs.</p>
      </header>

      {/* SEARCH CARD */}
      <div className="glass-thick p-6 rounded-[28px] border-white/5 space-y-6 shadow-xl">
        <h3 className="font-bold text-base">Find a Friend</h3>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Split ID (e.g. SPX-84A9KD)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* SEARCH RESULT DISPLAY */}
        {searchLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {!searchLoading && searchResult && (
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-indigo-500/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/25 shadow-inner">
                {getAvatarFallback(searchResult.full_name)}
              </div>
              <div>
                <h4 className="font-bold text-sm">{searchResult.full_name}</h4>
                <p className="text-xs text-slate-500 mono">{searchResult.split_id}</p>
              </div>
            </div>

            <div>
              {searchStatus === 'self' && (
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">That's You</span>
              )}
              {searchStatus === 'friend' && (
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-4 h-4" /> Already Friends
                </span>
              )}
              {searchStatus === 'pending_sent' && (
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Request Sent
                </span>
              )}
              {searchStatus === 'pending_received' && (
                <button
                  onClick={() => acceptFriendRequest(searchResult.id)}
                  disabled={actionLoading === searchResult.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Accept Request
                </button>
              )}
              {searchStatus === 'none' && (
                <button
                  onClick={() => sendFriendRequest(searchResult.id)}
                  disabled={actionLoading === searchResult.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Friend
                </button>
              )}
            </div>
          </div>
        )}

        {!searchLoading && searchQuery && !searchResult && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> No user found matching Split ID "{searchQuery.toUpperCase()}"
          </div>
        )}
      </div>

      {/* REQUESTS AND FRIENDS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pending Requests Column */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="font-bold text-lg">Incoming Requests</h3>
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <p className="text-sm text-slate-500 italic pl-1">No incoming requests.</p>
            ) : (
              incomingRequests.map((req) => (
                <div key={req.friendProfile.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {getAvatarFallback(req.friendProfile.full_name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{req.friendProfile.full_name}</h4>
                      <p className="text-[10px] text-slate-500 mono">{req.friendProfile.split_id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(req.friendProfile.id)}
                      disabled={actionLoading === req.friendProfile.id}
                      className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(req.friendProfile.id)}
                      disabled={actionLoading === req.friendProfile.id}
                      className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 className="font-bold text-lg pt-4">Sent Requests</h3>
          <div className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <p className="text-sm text-slate-500 italic pl-1">No pending sent requests.</p>
            ) : (
              outgoingRequests.map((req) => (
                <div key={req.friendProfile.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {getAvatarFallback(req.friendProfile.full_name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{req.friendProfile.full_name}</h4>
                      <p className="text-[10px] text-slate-500 mono">{req.friendProfile.split_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => rejectFriendRequest(req.friendProfile.id)}
                    disabled={actionLoading === req.friendProfile.id}
                    className="p-1.5 bg-white/5 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                    title="Cancel Request"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Friends List Column */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Active Friends ({acceptedFriends.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {acceptedFriends.length === 0 ? (
              <div className="col-span-full glass-card p-10 rounded-[24px] text-center text-slate-500 text-sm">
                You haven't added any friends yet. Find them above using their Split ID!
              </div>
            ) : (
              acceptedFriends.map((f) => (
                <div key={f.friendProfile.id} className="glass-card p-5 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shadow-inner">
                      {getAvatarFallback(f.friendProfile.full_name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{f.friendProfile.full_name}</h4>
                      <p className="text-xs text-slate-500 mono">{f.friendProfile.split_id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => rejectFriendRequest(f.friendProfile.id)}
                    disabled={actionLoading === f.friendProfile.id}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all duration-300"
                    title="Remove Friend"
                  >
                    <UserX className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
