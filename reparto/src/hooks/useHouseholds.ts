import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import type { Household, PlanTier, UserProfile } from '../types'
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
import { consumePendingJoin } from '../lib/joinInvite'
import { cloudErrorMessage } from '../lib/cloudErrors'
import { pendingJoinId, resolveInvitedHousehold } from '../lib/inviteContext'

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
      const joinId = pendingJoinId()
      if (joinId && !listed.some((household) => household.id === joinId)) {
        try {
          const invited = await loadHousehold(joinId)
          if (invited) listed = [invited, ...listed]
        } catch (cause) {
          setError(cloudErrorMessage(cause, 'No pudimos cargar la invitación'))
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
        joinId && normalized.some((household) => household.id === joinId)
          ? joinId
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
      if (!user?.email) {
        throw new Error('Falta el correo de tu cuenta Google.')
      }
      setLoading(true)
      const email = user.email.toLowerCase()
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
        const joinId = pendingJoinId()
        let listed = await listUserHouseholds(user.uid, email)
        if (joinId && !listed.some((item) => item.id === joinId)) {
          const invited = await loadHousehold(joinId)
          if (invited) listed = [invited, ...listed]
        }
        let household: Household | null =
          resolveInvitedHousehold(listed, email) ?? listed[0] ?? null
        if (!household && joinId) {
          household = await loadHousehold(joinId)
        }
        if (joinId && !household) {
          throw new Error(
            'No encontramos la invitación. Pide que te reenvíen el enlace al hogar.',
          )
        }
        if (household && !household.memberEmails.some((item) => item.toLowerCase() === email)) {
          throw new Error(
            `Tu Gmail (${email}) no está autorizado en “${household.name}”. Pide que lo agreguen en Mi hogar y familia y te reenvíen el enlace.`,
          )
        }
        if (!household) {
          if (joinId) {
            throw new Error(
              'No pudimos unirte al hogar. Verifica que tu Gmail esté autorizado y que te reenvíen el enlace de invitación.',
            )
          }
          household = await createHousehold(user.uid, email, input.householdName)
        }
        const activeHousehold = household
        await joinInvitedHousehold(
          activeHousehold,
          user.uid,
          email,
          nextProfile.displayName,
        )
        if (joinId && activeHousehold.id === joinId) {
          consumePendingJoin(sessionStorage, localStorage)
        }
        const normalized = withJoinedMember(
          activeHousehold,
          user.uid,
          email,
          nextProfile.displayName,
        )
        setProfile(nextProfile)
        setHouseholds([
          normalized,
          ...listed.filter((item) => item.id !== activeHousehold.id),
        ])
        setActiveHouseholdIdState(activeHousehold.id)
        localStorage.setItem(activeKey(user.uid), activeHousehold.id)
      } catch (cause) {
        throw new Error(
          cloudErrorMessage(cause, 'No se pudo completar tu perfil'),
        )
      } finally {
        setLoading(false)
      }
    },
    [user],
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

