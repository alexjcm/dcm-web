import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, useSearchParams } from 'react-router'
import { API_BASE_URL } from '../config/app'
import { useOnlineStatus } from '../hooks/use-online-status'
import { PageLoader } from '../components/ui/loaders'
import {
  clearLinkCandidateUserId,
  clearLinkSession,
  persistLinkCandidateUserId,
  persistLinkSession,
  readLinkCandidateUserId,
  readLinkSessionToken
} from '../lib/auth-link-session'

type CandidateIdentity = {
  user_id: string
  provider: string
  connection: string
}

const getCandidateLabel = (candidate: CandidateIdentity, index: number): string => {
  const source = candidate.connection || candidate.provider

  return source ? `Cuenta DCM ${index + 1} · ${source}` : `Cuenta DCM ${index + 1}`
}

export const LinkAccountPage = () => {
  const { loginWithRedirect, getAccessTokenSilently, isAuthenticated, isLoading, user, error: auth0Error } = useAuth0()
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateIdentity | null>(null)
  const linkingRef = useRef(false)

  const urlSessionToken = searchParams.get('session_token')

  useEffect(() => {
    if (urlSessionToken) {
      if (readLinkSessionToken() !== urlSessionToken) {
        clearLinkCandidateUserId()
      }

      persistLinkSession({
        sessionToken: urlSessionToken,
      })

      if (isAuthenticated || !!user) {
        setSearchParams({}, { replace: true })
      }
    }
  }, [isAuthenticated, setSearchParams, urlSessionToken, user])

  const sessionToken = urlSessionToken || readLinkSessionToken()

  const payload = useMemo(() => {
    if (!sessionToken) return null
    try {
      return JSON.parse(atob(sessionToken.split('.')[1]))
    } catch (e) {
      return null
    }
  }, [sessionToken])

  const candidates: CandidateIdentity[] = payload?.candidate_identities ?? []

  useEffect(() => {
    if (!sessionToken) {
      return
    }

    persistLinkSession({
      sessionToken,
    })
  }, [sessionToken])

  useEffect(() => {
    if (selectedCandidate) {
      return
    }

    const persistedCandidateUserId = readLinkCandidateUserId()
    const persistedCandidate = candidates.find((candidate) => candidate.user_id === persistedCandidateUserId)

    if (persistedCandidate) {
      setSelectedCandidate(persistedCandidate)
      return
    }

    if (candidates.length === 1) {
      setSelectedCandidate(candidates[0])
    }
  }, [candidates, selectedCandidate])

  const authenticatedAsPrimary = isAuthenticated && user?.sub === selectedCandidate?.user_id

  useEffect(() => {
    if (authenticatedAsPrimary && !linking && !linkingRef.current && sessionToken && selectedCandidate?.user_id && !error) {
      void executeCompleteLink()
    }
  }, [authenticatedAsPrimary, linking, sessionToken, selectedCandidate, error])

  const executeCompleteLink = async (): Promise<void> => {
    if (linkingRef.current) return
    const candidateId = selectedCandidate?.user_id
    if (!candidateId) return

    setLinking(true)
    linkingRef.current = true
    setError(null)

    try {
      if (!sessionToken) {
        throw new Error('Faltan datos de sesión críticos.')
      }

      const token = await getAccessTokenSilently()

      const res = await fetch(`${API_BASE_URL}/api/auth/link-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          candidateUserId: candidateId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.detail || 'Error en el servidor de enlace')
      }

      clearLinkSession()
      setSearchParams({}, { replace: true })
      navigate('/contributions', { replace: true })

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setLinking(false)
      linkingRef.current = false
    }
  }


  const handleStartLink = async (candidate: CandidateIdentity) => {
    if (!isOnline) {
      setError('Debes estar en línea para completar el enlace.')
      return
    }

    if (!sessionToken) {
      setError('Faltan datos de sesión críticos.')
      return
    }

    setSelectedCandidate(candidate)
    persistLinkCandidateUserId(candidate.user_id)
    const returnToParams = new URLSearchParams()
    returnToParams.set('session_token', sessionToken)
    const returnToUrl = `/link-account?${returnToParams.toString()}`

    await loginWithRedirect({
      appState: { returnTo: returnToUrl },
      authorizationParams: {
        connection: candidate.connection,
        prompt: 'login',
      },
    })
  }

  // ── Renders ──────────────────────────────────────────────────────────────────

  if (isLoading || (isAuthenticated && linking)) {
    return <PageLoader label={linking ? 'Completando enlace...' : 'Cargando...'} />
  }

  if (!sessionToken || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 text-center text-danger-600 bg-red-50 rounded-xl border border-red-100">
          <p className="font-bold">Sesión de enlace inválida o expirada.</p>
          <p className="text-xs mt-2">Inicia el proceso otra vez desde el inicio de sesión con Google.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-neutral-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Enlazar cuentas</h1>
          <p className="text-neutral-500 text-sm">
            Ya existe una cuenta de DCM compatible con este acceso social.
            Confirma tu contraseña para enlazar las cuentas.
          </p>
        </div>
        
        {auth0Error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
            Error de Auth0: {auth0Error.message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">{error}</div>
        )}

        {!isAuthenticated && candidates.length > 1 && (
          <div className="space-y-2" role="group" aria-label="Cuenta DCM que deseas enlazar">
            <p className="text-sm font-semibold text-neutral-700">Selecciona la cuenta DCM que confirmarás</p>
            {candidates.map((candidate, index) => {
              const isSelected = selectedCandidate?.user_id === candidate.user_id

              return (
                <button
                  key={candidate.user_id}
                  type="button"
                  onClick={() => setSelectedCandidate(candidate)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-800'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50/60'
                  }`}
                >
                  {getCandidateLabel(candidate, index)}
                </button>
              )
            })}
          </div>
        )}

        {!isAuthenticated && (
          <button
            onClick={() => selectedCandidate && handleStartLink(selectedCandidate)}
            disabled={!isOnline || !selectedCandidate || linking}
            className="w-full rounded-lg bg-neutral-800 py-3 font-bold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {linking ? 'Procesando...' : selectedCandidate ? 'Confirmar contraseña' : 'Selecciona una cuenta'}
          </button>
        )}

        {isAuthenticated && !linking && !error && authenticatedAsPrimary && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <PageLoader label="Finalizando enlace..." />
            <p className="text-xs text-neutral-400">Si tarda demasiado, actualiza la página.</p>
          </div>
        )}

        {isAuthenticated && !linking && !error && !authenticatedAsPrimary && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
            Debes confirmar con la cuenta DCM existente para completar el enlace.
          </div>
        )}

        {isAuthenticated && error && (
          <button
            onClick={() => {
              setError(null)
              void executeCompleteLink()
            }}
            disabled={linking || !selectedCandidate}
            className="w-full rounded-lg bg-neutral-800 py-3 font-bold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Reintentar enlace
          </button>
        )}

        {/* Botón de emergencia si el SDK está lento */}
        {!isAuthenticated && !isLoading && (
          <button
            onClick={() => window.location.reload()}
            className="w-full text-primary-600 text-sm font-medium hover:underline mt-4"
          >
            ¿Ya confirmaste? Haz clic aquí para verificar
          </button>
        )}
      </div>
    </div>
  )
}
