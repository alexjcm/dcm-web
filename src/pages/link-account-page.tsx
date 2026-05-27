import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, useSearchParams } from 'react-router'
import { API_BASE_URL } from '../config/app'
import { useOnlineStatus } from '../hooks/use-online-status'
import { PageLoader } from '../components/ui/loaders'
import { clearLinkSession, persistLinkSession, readLinkSessionToken } from '../lib/auth-link-session'

type CandidateIdentity = {
  user_id: string
  provider: string
  connection: string
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

  // Auto-seleccionar si solo hay un candidato
  useEffect(() => {
    if (candidates.length === 1 && !selectedCandidate) {
      setSelectedCandidate(candidates[0])
    }
  }, [candidates.length, selectedCandidate])

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
    return <PageLoader label={linking ? 'Completando enlace seguro...' : 'Cargando...'} />
  }

  if (!sessionToken || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 text-center text-danger-600 bg-red-50 rounded-xl border border-red-100">
          <p className="font-bold">Sesión de enlace inválida o expirada.</p>
          <p className="text-xs mt-2">Por favor, inicia el proceso desde el login de Google de nuevo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-neutral-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Enlazar Cuentas</h1>
          <p className="text-neutral-500 text-sm">
            Ya existe una cuenta de DCM compatible con este acceso social.
            Confirma tu contraseña para completar el enlace seguro.
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

        {!isAuthenticated && (
          <button
            onClick={() => candidates[0] && handleStartLink(candidates[0])}
            disabled={!isOnline || candidates.length === 0 || linking}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
          >
            {linking ? 'Procesando...' : 'Confirmar Contraseña'}
          </button>
        )}

        {isAuthenticated && !linking && !error && authenticatedAsPrimary && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <PageLoader label="Finalizando enlace..." />
            <p className="text-xs text-neutral-400">Si tardas mucho, pulsa F5</p>
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
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
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
