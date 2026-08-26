import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import type { Household, PlanTier, UserProfile } from '../types'
import {
  createHousehold,
  inviteHouseholdMember,
  joinInvitedHousehold,
  listUserHouseholds,
  loadUserProfile,
  removeHouseholdMember,
  saveUserProfile,
  updateHousehold,
} from '../lib/cloud'

const activeKey = (uid: string) => `a-la-par-active-household-${uid}`

export function useHouseholds(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [households, setHouseholds] = useState<Household[]>([])
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(
    null,
  )
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const email = user?.email
    if (!user || !email) {
      setProfile(null)
      setHouseholds([])
      setActiveHouseholdIdState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [nextProfile, loadedHouseholds] = await Promise.all([
        loadUserProfile(user.uid),
        listUserHouseholds(user.uid, email),
      ])
      const nextHouseholds =
        nextProfile && loadedHouseholds.length === 0
          ? [
              await createHousehold(
                user.uid,
                email,
                `${nextProfile.firstName || 'Mi'} hogar`,
              ),
            ]
          : loadedHouseholds
      for (const household of nextHouseholds) {
        await joinInvitedHousehold(household, user.uid, email)
      }
      const normalized = nextHouseholds.map((household) => ({
        ...household,
        memberUids: household.memberUids.includes(user.uid)
          ? household.memberUids
          : [...household.memberUids, user.uid],
        roles: {
          ...household.roles,
          [user.uid]: household.roles[user.uid] ?? 'member',
        },
        memberUidByEmail: {
          ...(household.memberUidByEmail ?? {}),
          [email.toLowerCase()]: user.uid,
        },
      }))
      setProfile(nextProfile)
      setHouseholds(normalized)
      const remembered = localStorage.getItem(activeKey(user.uid))
      setActiveHouseholdIdState(
        normalized.some((h) => h.id === remembered)
          ? remembered
          : (normalized[0]?.id ?? null),
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo cargar tu cuenta',
      )
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const completeProfile = useCallback(
    async (input: {
      firstName: string
      lastName: string
      phone: string
      householdName: string
    }) => {
      if (!user?.email) return
      setLoading(true)
      const now = new Date().toISOString()
      const nextProfile: UserProfile = {
        uid: user.uid,
        email: user.email.toLowerCase(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        displayName: `${input.firstName} ${input.lastName}`.trim(),
        photoURL: user.photoURL ?? undefined,
        createdAt: now,
        updatedAt: now,
      }
      try {
        await saveUserProfile(nextProfile)
        const household =
          households[0] ??
          (await createHousehold(
            user.uid,
            user.email,
            input.householdName,
          ))
        await joinInvitedHousehold(household, user.uid, user.email)
        const normalized = {
          ...household,
          memberUids: household.memberUids.includes(user.uid)
            ? household.memberUids
            : [...household.memberUids, user.uid],
          roles: {
            ...household.roles,
            [user.uid]: household.roles[user.uid] ?? ('member' as const),
          },
          memberUidByEmail: {
            ...(household.memberUidByEmail ?? {}),
            [user.email.toLowerCase()]: user.uid,
          },
        }
        setProfile(nextProfile)
        setHouseholds([normalized, ...households.slice(1)])
        setActiveHouseholdIdState(household.id)
        localStorage.setItem(activeKey(user.uid), household.id)
      } finally {
        setLoading(false)
      }
    },
    [user, households],
  )

  const setActiveHouseholdId = useCallback(
    (id: string) => {
      setActiveHouseholdIdState(id)
      if (user) localStorage.setItem(activeKey(user.uid), id)
    },
    [user],
  )

  const invite = useCallback(
    async (email: string) => {
      if (!activeHouseholdId) return
      await inviteHouseholdMember(activeHouseholdId, email)
      await refresh()
    },
    [activeHouseholdId, refresh],
  )

  const activeHousehold = useMemo(
    () => households.find((h) => h.id === activeHouseholdId) ?? null,
    [households, activeHouseholdId],
  )

  const removeMember = useCallback(
    async (email: string) => {
      if (!activeHousehold) return
      const uid = activeHousehold.memberUidByEmail?.[email.toLowerCase()] ?? null
      await removeHouseholdMember(activeHousehold.id, uid, email)
      await refresh()
    },
    [activeHousehold, refresh],
  )

  const setPlan = useCallback(
    async (planTier: PlanTier) => {
      if (!activeHouseholdId) return
      await updateHousehold(activeHouseholdId, { planTier })
      setHouseholds((prev) =>
        prev.map((h) =>
          h.id === activeHouseholdId ? { ...h, planTier } : h,
        ),
      )
    },
    [activeHouseholdId],
  )

  const updateProfile = useCallback(
    async (patch: {
      firstName: string
      lastName: string
      phone: string
    }) => {
      if (!profile) return
      const next: UserProfile = {
        ...profile,
        ...patch,
        firstName: patch.firstName.trim(),
        lastName: patch.lastName.trim(),
        phone: patch.phone.trim(),
        displayName: `${patch.firstName} ${patch.lastName}`.trim(),
        updatedAt: new Date().toISOString(),
      }
      await saveUserProfile(next)
      setProfile(next)
    },
    [profile],
  )

  return {
    profile,
    households,
    activeHousehold,
    activeHouseholdId,
    loading,
    error,
    completeProfile,
    setActiveHouseholdId,
    invite,
    removeMember,
    setPlan,
    updateProfile,
    refresh,
  }
}

