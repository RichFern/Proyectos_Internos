import { useState, type FormEvent } from 'react'
import { BrandLogo } from './BrandLogo'
import { CurrencyField } from './CurrencyField'
import { resolveDefaultCurrency } from '../lib/userPreferences'

interface Props {
  email: string
  googleName?: string | null
  joiningHouseholdName?: string | null
  loadError?: string | null
  onHomeClick?: () => void
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
  loadError,
  onHomeClick,
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

  const joining = Boolean(joiningHouseholdName)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Completa tu nombre y apellido.')
      return
    }
    if (!joining && !phone.trim()) {
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
        <BrandLogo size="lg" showWordmark onHomeClick={onHomeClick} />
        <h1>{joining ? 'Únete al hogar' : 'Crea tu cuenta'}</h1>
        <p className="brand-sub">
          {joining
            ? `Te estás uniendo a “${joiningHouseholdName}”. Completa tus datos para continuar.`
            : 'Este perfil te identifica dentro de tu familia. Puedes modificarlo más adelante.'}
        </p>
        {loadError ? <p className="form-error">{loadError}</p> : null}
        <form className="form-grid" onSubmit={submit} noValidate>
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
              required={!joining}
            />
          </label>
          {!joining ? (
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

