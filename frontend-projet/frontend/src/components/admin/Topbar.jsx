import { useEtab } from '../../context/EtablissementContext'
import { useAuth } from '../../context/AuthContext'

const pageNames = {
  dashboard:    'Tableau de bord',
  users:        'Utilisateurs',
  matieres:     'Matières',
  promos:       'Promotions',
  associations: 'Associations',
  archives:     'Archives',
  profile:      'Mon profil',
}

export default function Topbar({ activePage, onNavigate }) {
  const { badge, type } = useEtab()
  const { user } = useAuth()
  const firstName = user?.prenom || user?.firstName || ''
  const lastName  = user?.nom   || user?.lastName  || ''

  return (
    <div className="topbar" style={{
      background: 'var(--bg-secondary, rgba(255,255,255,0.88))',
      borderBottom: '1px solid var(--border, rgba(255,255,255,0.75))',
      padding: '0 28px',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 20px rgba(37,99,235,0.07)',
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted, #8b85a8)' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary, #1a1535)' }}>ExoCraft</span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span>{badge}</span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #1a1535)' }}>
          {pageNames[activePage] ?? activePage}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Badge établissement */}
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: type === 'licence' ? 'rgba(6,182,212,0.12)' : 'rgba(37,99,235,0.10)',
          color: type === 'licence' ? '#06B6D4' : '#2563EB',
        }}>
          {badge}
        </span>

        {/* Avatar */}
        <div
          onClick={() => onNavigate('profile')}
          title="Mon profil"
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
            boxShadow: activePage === 'profile'
              ? '0 0 0 3px rgba(37,99,235,0.3)'
              : '0 2px 10px rgba(37,99,235,0.3)',
            border: activePage === 'profile' ? '2px solid #2563EB' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          {(firstName[0] || 'A').toUpperCase()}{(lastName[0] || 'D').toUpperCase()}
        </div>
      </div>
    </div>
  )
}
