import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { hasPinProtection, markUnlocked, verifyPin, loadAccessConfig } from '../lib/access'
import { BrandLogo } from './BrandLogo'
import { BRAND } from '../lib/brand'

interface Props {
  onUnlocked: () => void
}

export function LockScreen({ onUnlocked }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const config = loadAccessConfig()

  useEffect(() => {
    if (!hasPinProtection()) onUnlocked()
  }, [onUnlocked])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await verifyPin(pin)
      if (!ok) {
        setError('PIN incorrecto')
        setPin('')
        return
      }
      markUnlocked()
      onUnlocked()
    } finally {
      setBusy(false)
    }
  }

  if (!hasPinProtection()) return null

  return (
    <div className="lock-screen">
      <div className="lock-card panel">
        <BrandLogo size="lg" showWordmark />
        <p className="brand-sub">{BRAND.name} está protegida con un PIN</p>
        {config?.allowedPeople ? (
          <p className="hint">Para: {config.allowedPeople}</p>
        ) : null}
        <form className="form-grid" onSubmit={submit}>
          <label className="field">
            PIN de acceso
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              required
              minLength={4}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy || pin.length < 4}>
            Entrar
          </button>
        </form>
        <p className="hint" style={{ marginTop: '1rem' }}>
          Solo quienes tengan el PIN pueden ver los gastos en este dispositivo.
        </p>
      </div>
    </div>
  )
}
