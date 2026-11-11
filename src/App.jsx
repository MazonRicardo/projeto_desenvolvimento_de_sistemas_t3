
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import TaskList from './components/TaskList'
import CadastrarFuncionario from './components/CadastrarFuncionario'
import GerenciarSetores from './components/GerenciarSetores'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authView, setAuthView] = useState('landing')
  const [tela, setTela] = useState('tarefas')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('greentask_theme')
    if (saved) return saved

    return window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('greentask_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

 
useEffect(() => {
  let mounted = true

  const initializeAuth = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (!mounted) return

    if (error) {
      console.error('Erro ao recuperar sessão:', error)
      setUser(null)
      setLoading(false)
      return
    }

    setUser(data.session?.user ?? null)
    setLoading(false)
  }

  initializeAuth()

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return

    setUser(session?.user ?? null)
    setLoading(false)
  })

  return () => {
    mounted = false
    subscription.unsubscribe()
  }
}, [])


  const handleLogout = async () => {
    setLoggingOut(true)

    const { error } = await supabase.auth.signOut()

    setLoggingOut(false)

    if (error) {
      alert('Não foi possível sair: ' + error.message)
      return
    }

    setShowLogoutModal(false)
    setUser(null)
    setAuthView('landing')
    setTela('tarefas')
  }

  const isOwner =
    user?.email === 'ricardo.mazon@escola.pr.gov.br' ||
    user?.user_metadata?.role === 'proprietario'

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-spinner" />
        <span>Carregando GreenTask...</span>
      </div>
    )
  }

  if (!user) {
    return authView === 'login' ? (
      <Login
        onLogin={setUser}
        onBack={() => setAuthView('landing')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    ) : (
      <LandingPage
        onGoToLogin={() => setAuthView('login')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <div className="app-layout">

      <header className="app-header">

        <div
          className="app-brand"
          onClick={() => setTela('tarefas')}
        >
          <div className="app-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="#16a34a" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="app-brand-title">GreenTask</span>
        </div>

        {isOwner ? (
          <nav className="app-nav-tabs">

            <button
              onClick={() => setTela('tarefas')}
              className={`app-nav-btn ${tela === 'tarefas' ? 'active' : ''}`}
            >
              ✓ <span>Tarefas</span>
            </button>

            <button
              onClick={() => setTela('funcionarios')}
              className={`app-nav-btn ${tela === 'funcionarios' ? 'active' : ''}`}
            >
              ♙ <span>Funcionários</span>
            </button>

            <button
              onClick={() => setTela('setores')}
              className={`app-nav-btn ${tela === 'setores' ? 'active' : ''}`}
            >
              ▣ <span>Setores</span>
            </button>

          </nav>
        ) : (
          <div className="app-nav-placeholder" />
        )}

        <div className="app-user-section">

          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>

          <div className="app-user-chip">
            <span className="app-user-avatar">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="app-user-email">
              {user.email}
            </span>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="app-logout-btn"
          >
            ⇥ <span>Sair</span>
          </button>

        </div>
      </header>

      <main className="app-main">
        <div key={tela} className="page-transition">

          {tela === 'tarefas' && (
            <TaskList user={user} />
          )}

          {tela === 'funcionarios' && isOwner && (
            <CadastrarFuncionario
              onClose={() => setTela('tarefas')}
            />
          )}

          {tela === 'setores' && isOwner && (
            <GerenciarSetores
              onClose={() => setTela('tarefas')}
            />
          )}

        </div>
      </main>

      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => !loggingOut && setShowLogoutModal(false)}
        >
          <div
            className="logout-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >

            <div className="logout-modal-icon">↪</div>

            <h2 id="logout-title">Sair da conta?</h2>

            <p>
              Tem certeza de que deseja sair do GreenTask?
              Você precisará entrar novamente para acessar
              suas tarefas.
            </p>

            <div className="logout-modal-actions">

              <button
                className="logout-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                Cancelar
              </button>

              <button
                className="logout-confirm-btn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Saindo...' : 'Sim, sair'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
