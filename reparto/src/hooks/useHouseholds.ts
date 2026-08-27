import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import type { Household, PlanTier, UserProfile } from '../types'
import { isEmailAllowed, accessEmails } from '../lib/allowlist'
import {
  createHousehold,
  inviteHouseholdMember,
  joinInvitedHousehold,
  listUserHouseholds,
  loadHousehold,
  loadUserProfile,
  removeHouseholdMember,
  saveUserProfile,
  updateHousehold,
} from '../lib/cloud'
import { consumePendingJoin, peekPendingJoin } from '../lib/joinInvite'

const activeKey = (uid: string) => `a-la-par-active-household-${uid}`

function withJoinedMember(
  household: Household,
  uid: string,
  email: string,
  displayName?: string,
): Household {
  const key = email.toLowerCase()
  return {
    ...household,
    memberUids: household.memberUids.includes(uid)
      ? household.memberUids
      : [...household.memberUids, uid],
    roles: {
      ...household.roles,
      [uid]: household.roles[uid] ?? 'member',
    },
    memberUidByEmail: {
      ...(household.memberUidByEmail ?? {}),
      [key]: uid,
    },
    memberNamesByEmail: displayName
      ? { ...(household.memberNamesByEmail ?? {}), [key]: displayName }
      : (household.memberNamesByEmail ?? {}),
  }
}

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
      let listed = loadedHouseholds
      const pendingJoin = peekPendingJoin(sessionStorage, localStorage)
      if (pendingJoin && !listed.some((household) => household.id === pendingJoin)) {
        try {
          const invited = await loadHousehold(pendingJoin)
          if (invited) listed = [invited, ...listed]
        } catch {
          /* sin acceso todavía: el email tiene que estar autorizado */
        }
      }
      const nextHouseholds =
        nextProfile && listed.length === 0
          ? [
              await createHousehold(
                user.uid,
                email,
                `${nextProfile.firstName || 'Mi'} hogar`,
              ),
            ]
          : listed
      const displayName = nextProfile?.displayName
      for (const household of nextHouseholds) {
        await joinInvitedHousehold(household, user.uid, email, displayName)
      }
      const normalized = nextHouseholds.map((household) =>
        withJoinedMember(household, user.uid, email, displayName),
      )
      setProfile(nextProfile)
      setHouseholds(normalized)
      const remembered = localStorage.getItem(activeKey(user.uid))
      const joinActive =
        pendingJoin && normalized.some((household) => household.id === pendingJoin)
          ? pendingJoin
          : null
      if (joinActive) {
        consumePendingJoin(sessionStorage, localStorage)
        localStorage.setItem(activeKey(user.uid), joinActive)
      }
      setActiveHouseholdIdState(
        joinActive ??
          (normalized.some((h) => h.id === remembered)
            ? remembered
            : (normalized[0]?.id ?? null)),
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
      defaultCurrency: string
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
        defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
        photoURL: user.photoURL ?? undefined,
        createdAt: now,
        updatedAt: now,
      }
      try {
        await saveUserProfile(nextProfile)
        const joinId = peekPendingJoin(sessionStorage, localStorage)
        let household =
          (joinId
            ? households.find((item) => item.id === joinId)
            : households[0]) ?? null
        if (!household && joinId) {
          try {
            household = await loadHousehold(joinId)
          } catch {
            household = null
          }
        }
        if (!household) {
          household = await createHousehold(
            user.uid,
            user.email,
            input.householdName,
          )
        }
        await joinInvitedHousehold(
          household,
          user.uid,
          user.email,
          nextProfile.displayName,
        )
        if (joinId && household.id === joinId) {
          consumePendingJoin(sessionStorage, localStorage)
        }
        const normalized = withJoinedMember(
          household,
          user.uid,
          user.email,
          nextProfile.displayName,
        )
        setProfile(nextProfile)
        setHouseholds([
          normalized,
          ...households.filter((item) => item.id !== household!.id),
        ])
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
      if (accessEmails().length > 0 && !isEmailAllowed(email)) {
        throw new Error(
          'Ese Gmail no puede entrar en esta versión publicada. Si lo acabas de configurar en Netlify (VITE_ADMIN_EMAILS o VITE_ALLOWED_EMAILS), hay que volver a publicar: esas variables se graban al compilar. Después toca Agregar de nuevo.',
        )
      }
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
      defaultCurrency?: string
    }) => {
      if (!profile) return
      const next: UserProfile = {
        ...profile,
        ...patch,
        firstName: patch.firstName.trim(),
        lastName: patch.lastName.trim(),
        phone: patch.phone.trim(),
        displayName: `${patch.firstName} ${patch.lastName}`.trim(),
        defaultCurrency:
          patch.defaultCurrency?.trim().toUpperCase() ?? profile.defaultCurrency,
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

