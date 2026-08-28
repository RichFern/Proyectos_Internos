import { useState, type FormEvent } from 'react'
import { BrandLogo } from './BrandLogo'
import { CurrencyField } from './CurrencyField'
import { resolveDefaultCurrency } from '../lib/userPreferences'

interface Props {
  email: string
  googleName?: string | null
  joiningHouseholdName?: string | null
  onComplete: (input: {
    firstName: string
    lastName: string
    phone: string
    householdName: string
    defaultCurrency: string
  }) => Promise<void>
}

export function ProfileOnboardingModal({
  email,
  googleName,
  joiningHouseholdName,
  onComplete,
}: Props) {
  const parts = (googleName ?? '').trim().split(/\s+/)
  const [firstName, setFirstName] = useState(parts[0] ?? '')
  const [lastName, setLastName] = useState(parts.slice(1).join(' '))
  const [phone, setPhone] = useState('')
  const [householdName, setHouseholdName] = useState('Mi hogar')
  const [currency, setCurrency] = useState(resolveDefaultCurrency())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Completa tu nombre y apellido.')
      return
    }
    if (!joiningHouseholdName && !phone.trim()) {
      setError('Indica un teléfono de contacto.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onComplete({
        firstName,
        lastName,
        phone: phone.trim() || '—',
        householdName,
        defaultCurrency: currency,
      })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo crear tu cuenta',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card panel onboarding-card">
        <BrandLogo size="lg" showWordmark />
        <h1>Crea tu cuenta</h1>
        <p className="brand-sub">
          {joiningHouseholdName
            ? `Te estás uniendo a “${joiningHouseholdName}”. Completa tus datos para continuar.`
            : 'Este perfil te identifica dentro de tu familia. Puedes modificarlo más adelante.'}
        </p>
        <form className="form-grid" onSubmit={submit}>
          <div className="form-row">
            <label className="field">
              Nombre
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Apellido
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          </div>
          <label className="field">
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+56 9 1234 5678"
              required={!joiningHouseholdName}
            />
          </label>
          {!joiningHouseholdName ? (
            <label className="field">
              Nombre del hogar
              <input
                value={householdName}
                onChange={(event) => setHouseholdName(event.target.value)}
                placeholder="Mi hogar"
                required
              />
            </label>
          ) : null}
          <CurrencyField
            value={currency}
            onChange={setCurrency}
            label="Moneda habitual"
            hint="Se usará al crear espacios. Puedes cambiarla por espacio o por gasto."
          />
          <p className="hint">Cuenta Google: {email}</p>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creando…' : 'Entrar a A la PaR'}
          </button>
        </form>
      </div>
    </div>
  )
}

