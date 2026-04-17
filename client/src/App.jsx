import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Find from './pages/Find'
import Tracker from './pages/Tracker'
import Settings from './pages/Settings'
import Spinner from './components/Spinner'
import { apiFetch } from './api'

export default function App() {
  const [tab, setTab] = useState('find')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail') === 'connected') {
      localStorage.setItem('gmail_connected', 'true')
      window.history.replaceState(null, '', '/dashboard')
    }

    const token = localStorage.getItem('cm_token')
    if (!token) { window.location.href = '/login'; return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.email) setEmail(payload.email)
    } catch (_) {}

    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await apiFetch('/profile')
      setProfile(data)
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('cm_token')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex flex-col">
      <Nav tab={tab} onTab={setTab} email={email} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-10 pb-20">
        {tab === 'find'    && <Find profile={profile} />}
        {tab === 'tracker' && <Tracker />}
        {tab === 'settings' && <Settings profile={profile} onSaved={loadProfile} />}
      </main>
    </div>
  )
}
