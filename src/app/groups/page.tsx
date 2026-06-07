'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAvatarFallback } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import {
  Users,
  Plus,
  ArrowRight,
  FolderOpen,
  X,
  Search,
  Loader2,
  Check,
  UserPlus,
  AlertCircle
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  created_at: string
  created_by: string
}

interface Profile {
  id: string
  full_name: string
  split_id: string
}

export default function GroupsPage() {
  const toast = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Group Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchSplitId, setSearchSplitId] = useState('')
  const [addedMembers, setAddedMembers] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [myId, setMyId] = useState<string | null>(null)
  const [myProfile, setMyProfile] = useState<Profile | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setMyId(user.id)

        // Get my profile details
        const { data: myProf } = await supabase
          .from('profiles')
          .select('id, full_name, split_id')
          .eq('id', user.id)
          .single()
        setMyProfile(myProf)

        // 1. Fetch group IDs I am in
        const { data: gmData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        if (!gmData || gmData.length === 0) {
          setGroups([])
          return
        }

        const groupIds = gmData.map((gm) => gm.group_id)

        // 2. Fetch group details
        const { data: groupsData } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false })

        setGroups(groupsData || [])
      } catch (err) {
        console.error('Error loading groups:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  // Lookup member by Split ID to add to new group list
  const handleAddMemberBySplitId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchSplitId.trim() || !myId) return
    setSearchLoading(true)
    setSearchError(null)

    try {
      const targetSplitId = searchSplitId.trim().toUpperCase()

      if (myProfile && targetSplitId === myProfile.split_id) {
        setSearchError("You are already added as the group owner.")
        setSearchLoading(false)
        return
      }

      if (addedMembers.some((m) => m.split_id === targetSplitId)) {
        setSearchError("This user is already added to the list.")
        setSearchLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, split_id')
        .eq('split_id', targetSplitId)
        .maybeSingle()

      if (!profile) {
        setSearchError("No user found with this Split ID.")
        toast.error("No user found with this Split ID.")
      } else {
        // Verify friendship status is 'accepted'
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status')
          .or(`user_id.eq.${myId},friend_id.eq.${myId}`)
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
          .eq('status', 'accepted')
          .maybeSingle()

        if (!friendship) {
          setSearchError("You can only invite active friends. Send them a friend request first!")
          toast.error("You can only invite active friends.")
          setSearchLoading(false)
          return
        }

        setAddedMembers((prev) => [...prev, profile])
        setSearchSplitId('')
        toast.success(`${profile.full_name} added to invite list.`)
      }
    } catch (err) {
      console.error('Error adding member:', err)
      setSearchError("An error occurred. Please try again.")
      toast.error("An error occurred while searching.")
    } finally {
      setSearchLoading(false)
    }
  }

  // Remove added member from staging list
  const handleRemoveStagedMember = (id: string) => {
    const member = addedMembers.find((m) => m.id === id)
    setAddedMembers((prev) => prev.filter((m) => m.id !== id))
    if (member) {
      toast.info(`${member.full_name} removed from invite list.`)
    }
  }

  // Submit and create the group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !myId) return
    setCreateLoading(true)
    setError(null)

    try {
      // 1. Insert Group
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: myId,
        })
        .select()
        .single()

      if (groupErr) throw groupErr

      // 2. Prepare membership list
      // Owner + staged members
      const memberships = [
        { group_id: group.id, user_id: myId },
        ...addedMembers.map((m) => ({ group_id: group.id, user_id: m.id })),
      ]

      // 3. Insert memberships
      const { error: membersErr } = await supabase
        .from('group_members')
        .insert(memberships)

      if (membersErr) throw membersErr

      // 4. Update local state
      setGroups((prev) => [group, ...prev])
      setIsModalOpen(false)
      
      // Reset form
      setName('')
      setDescription('')
      setAddedMembers([])
      setSearchSplitId('')

      toast.success(`Sphere "${group.name}" created successfully!`)
    } catch (err: any) {
      console.error('Error creating group:', err)
      setError(err.message || 'Failed to create group. Please check settings.')
      toast.error(err.message || 'Failed to create group.')
    } finally {
      setCreateLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-6xl mx-auto space-y-12">
        {/* HEADER SKELETON */}
        <div className="flex justify-between items-center gap-6">
          <div className="space-y-2.5">
            <div className="h-9 w-48 skeleton rounded-xl"></div>
            <div className="h-4 w-32 skeleton rounded-lg"></div>
          </div>
          <div className="h-12 w-40 skeleton rounded-2xl"></div>
        </div>
        {/* GROUPS LIST SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-6 rounded-[28px] h-56 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl skeleton"></div>
                <div className="space-y-2">
                  <div className="h-5 w-40 skeleton rounded-lg"></div>
                  <div className="h-3.5 w-full skeleton rounded-md"></div>
                  <div className="h-3.5 w-2/3 skeleton rounded-md"></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="h-3 w-24 skeleton rounded-md"></div>
                <div className="h-4 w-20 skeleton rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-32 pt-12 px-6 lg:px-12 pb-24 max-w-6xl mx-auto space-y-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Your Spheres</h2>
          <p className="text-slate-400 text-sm mt-1">Manage, split, and settle up bills in social circles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02]"
        >
          <Plus className="w-4.5 h-4.5" /> Create a Group
        </button>
      </header>

      {/* GROUPS LIST */}
      {groups.length === 0 ? (
        <div className="glass-card rounded-[32px] p-16 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No expense groups yet</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Create a group above and invite friends by their Split ID to start tracking meals, accommodation, or trips.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="glass-card p-6 rounded-[28px] border-white/5 flex flex-col justify-between h-56 hover:border-indigo-500/20 group relative overflow-hidden"
            >
              <div className="absolute top-[-30%] right-[-30%] w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg shadow-inner">
                  {getAvatarFallback(group.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-foreground group-hover:text-indigo-400 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {group.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Created {new Date(group.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-xs text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Enter Sphere <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative w-full max-w-xl glass-thick rounded-[40px] border-white/10 p-8 md:p-10 space-y-6 shadow-2xl animate-modal-entry max-h-[90vh] overflow-y-auto">
            <header className="flex justify-between items-center">
              <h3 className="text-2xl font-bold tracking-tight">Create a Sphere</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-6">
              {/* Group Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Sphere Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tokyo Trip, Flatmates 402"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this sphere for?"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium resize-none"
                />
              </div>

              {/* Add Member section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Invite Members
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchSplitId}
                      onChange={(e) => setSearchSplitId(e.target.value)}
                      placeholder="Search Split ID (e.g. SPX-84A9KD)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-indigo-500 transition-colors text-sm font-medium uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMemberBySplitId}
                    disabled={searchLoading}
                    className="px-5 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {searchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Add
                      </>
                    )}
                  </button>
                </div>

                {searchError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-400" /> {searchError}
                  </div>
                )}

                {/* Staged Member List */}
                {addedMembers.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Invited List ({addedMembers.length})
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {addedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="glass-card pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold"
                        >
                          <span className="text-slate-300">{member.full_name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedMember(member.id)}
                            className="w-5 h-5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Sphere...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
