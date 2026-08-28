import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import type { Household } from '../types'
import { loadHousehold } from '../lib/cloud'
import { cloudErrorMessage } from '../lib/cloudErrors'
import { pendingJoinId } from '../lib/inviteContext'

export function useInviteBootstrap(user: User | null) {
  const [inviteHousehold, setInviteHousehold] = useState<Household | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const joinId = pendingJoinId()

  useEffect(() => {
    if (!user?.email || !joinId) {
      setInviteHousehold(null)
      setInviteError(null)
      setInviteLoading(false)
      return
    }

    let cancelled = false
    setInviteLoading(true)
    setInviteError(null)

    void loadHousehold(joinId)
      .then((household) => {
        if (cancelled) return
        setInviteHousehold(household)
        const email = user.email!.trim().toLowerCase()
        if (
          household &&
          !household.memberEmails.some((item) => item.toLowerCase() === email)
        ) {
          setInviteError(
            `Tu Gmail (${email}) no está autorizado en “${household.name}”. Pide que lo agreguen en Mi hogar y familia con exactamente ese correo y te reenvíen el enlace.`,
          )
        }
      })
      .catch((cause) => {
        if (cancelled) return
        setInviteHousehold(null)
        setInviteError(
          cloudErrorMessage(
            cause,
            'No pudimos cargar la invitación. Pide que reenvíen el enlace.',
          ),
        )
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.email, user?.uid, joinId])

  return { inviteHousehold, inviteError, inviteLoading, joinId }
}
