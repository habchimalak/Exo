import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ThemeToggle'

const navItems = [
  { id: 'dashboard',    label: 'Tableau de bord' },
  { id: 'users',        label: 'Utilisateurs'    },
  { id: 'promos',       label: 'Promotions'      },
  { id: 'matieres',     label: 'Matières'        },
  { id: 'associations', label: 'Associations'    },
  { id: 'archives',     label: 'Archives'        },
  { id: 'profile',      label: 'Mon profil'      },
]

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const { user } = useAuth()
  const firstName = user?.prenom || user?.firstName || ''
  const lastName  = user?.nom   || user?.lastName  || ''

  return (
    <aside className="sidebar" style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: 240, background: 'var(--bg-secondary, #fff)', borderRight: '1px solid var(--border, #e8e6f0)', display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', height: 72, borderBottom: '1px solid var(--border, #e8e6f0)', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 16,
          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        }}>E</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #0B1B4D)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Exo<span style={{ background: 'linear-gradient(135deg,#2563EB,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Craft</span>
          </div>
          <div style={{ fontSize: 9, background: 'rgba(37,99,235,0.10)', color: '#2563EB', padding: '2px 8px', borderRadius: 20, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted, #8b85a8)', padding: '12px 8px 8px', fontWeight: 700 }}>
          Navigation
        </div>
        {navItems.map(item => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                marginBottom: 2,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
                transition: 'all 0.15s',
                background: isActive ? 'linear-gradient(135deg,#2563EB,#4F46E5)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary, #4A5A8C)',
                boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = '#2563EB'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary, #4A5A8C)'; } }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border, rgba(255,255,255,0.75))', flexShrink: 0 }}>
        {/* Toggle thème */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 10px', marginBottom: 10,
          background: 'rgba(37,99,235,0.04)',
          border: '1px solid rgba(37,99,235,0.08)',
          borderRadius: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #7A88B8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Apparence
          </span>
          <ThemeToggle />
        </div>
        <div
          onClick={() => onNavigate('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 10, cursor: 'pointer', marginBottom: 10, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12,
          }}>
            {(firstName[0] || 'A').toUpperCase()}{(lastName[0] || 'D').toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #1a1535)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {firstName} {lastName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #8b85a8)' }}>Administrateur</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', borderRadius: 10, padding: '9px 14px',
            border: '1px solid #fad7d7', background: '#fff5f5',
            color: '#c0392b', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#c0392b'; }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
