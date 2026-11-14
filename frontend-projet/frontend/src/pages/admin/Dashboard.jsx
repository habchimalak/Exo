import { useState, useEffect, useCallback } from 'react'
import { statsApi, timeAgo, formatDateTime } from '../../services/adminApi'
import { useAuth } from '../../context/AuthContext'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

const TYPE_COLORS = {
  Quiz:      '#2563EB',
  Examen:    '#DC2626',
  Cours:     '#059669',
  Exercices: '#D97706',
  'Résumé':  '#7C3AED',
}

export default function Dashboard() {
  const { user } = useAuth()
  const now = useClock()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const firstName = user?.prenom || user?.firstName || ''
  const lastName  = user?.nom   || user?.lastName  || ''

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const loadStats = useCallback(async () => {
    try {
      const data = await statsApi.get()
      setStats(data)
    } catch (err) {
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const t = setInterval(loadStats, 30000)
    return () => clearInterval(t)
  }, [loadStats])

  const totalGenerations = stats?.totalGenerations ?? 0
  const aiGenerations    = stats?.recentActivity   ?? []
  const countByType      = stats?.contentsByType   ?? []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'adminSpin 0.8s linear infinite', margin: '0 auto 16px' }} />
        Chargement...
      </div>
    </div>
  )

  /* ── Stat cards data ── */
  const statCards = [
    { label: 'Enseignants actifs', value: stats?.activeEnseignants ?? 0, sub: `${stats?.totalEnseignants ?? 0} total`, tag: 'ENS', gradient: 'linear-gradient(135deg,#2563EB,#4F46E5)' },
    { label: 'Générations IA',     value: totalGenerations,              sub: `${stats?.thisMonthGenerations ?? 0} ce mois`, tag: 'IA',  gradient: 'linear-gradient(135deg,#06B6D4,#2563EB)' },
    { label: 'Documents archivés', value: stats?.totalDocs ?? 0,         sub: `${stats?.totalMatieres ?? 0} matières`, tag: 'DOC', gradient: 'linear-gradient(135deg,#059669,#06B6D4)' },
    { label: 'Utilisateurs total', value: stats?.totalUsers ?? 0,        sub: `${stats?.totalArchives ?? 0} archives`, tag: 'USR', gradient: 'linear-gradient(135deg,#D97706,#EF4444)' },
  ]

  return (
    <div>
      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 45%, #06B6D4 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 10px 32px rgba(37,99,235,0.28)',
      }}>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '50px solid rgba(255,255,255,0.05)', right: 60, top: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: '30px solid rgba(255,255,255,0.04)', bottom: -70, right: -30, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Administration · ExoCraft
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {greeting}, {firstName} {lastName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', maxWidth: 400, lineHeight: 1.6 }}>
            Supervisez la plateforme ExoCraft en temps réel.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
            {now.toLocaleTimeString('fr-FR')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{
            padding: 20, cursor: 'default',
            transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.gradient, marginBottom: 14 }} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, fontWeight: 900, lineHeight: 1, background: s.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Deux colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Générations par type */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Générations IA par type</div>
              <span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{totalGenerations} total</span>
            </div>
            {totalGenerations === 0 ? (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, fontWeight: 900, color: 'var(--text-muted)', opacity: 0.3, marginBottom: 8 }}>0</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune génération pour l'instant</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {countByType.map((item, i) => {
                  const color = TYPE_COLORS[item.type] ?? '#2563EB'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ width: 76, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.type}</div>
                      <div style={{ flex: 1, height: 7, background: 'rgba(37,99,235,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${totalGenerations > 0 ? (item.count / totalGenerations) * 100 : 0}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease', minWidth: item.count > 0 ? 4 : 0 }} />
                      </div>
                      <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color }}>{item.count}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tableau historique */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Historique des générations</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669', fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'adminBlink 1.5s infinite' }} />
                Temps réel
              </div>
            </div>
            {aiGenerations.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Aucune génération enregistrée</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    {['Enseignant', 'Sujet', 'Type', 'Date'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {aiGenerations.slice(0, 8).map(g => {
                    const color = TYPE_COLORS[g.type] ?? '#2563EB'
                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{g.enseignant}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.sujet}</div>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '18', color }}>{g.type}</span>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          <div>{formatDateTime(g.generatedAt)}</div>
                          <div style={{ opacity: 0.6, marginTop: 2 }}>{timeAgo(g.generatedAt)}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Répartition */}
          <div className="card">
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Répartition</div>
            {[
              { label: 'Enseignants actifs', count: stats?.activeEnseignants ?? 0, color: '#2563EB' },
              { label: 'Total enseignants',  count: stats?.totalEnseignants  ?? 0, color: '#06B6D4' },
              { label: 'Total utilisateurs', count: stats?.totalUsers        ?? 0, color: '#D97706' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(37,99,235,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(stats?.totalUsers ?? 0) > 0 ? (item.count / (stats?.totalUsers ?? 1)) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Activité récente */}
          <div className="card">
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Activité IA récente</div>
            {aiGenerations.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>Aucune activité récente</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiGenerations.slice(0, 6).map((g, i) => {
                  const color = TYPE_COLORS[g.type] ?? '#2563EB'
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{g.enseignant} — {g.type}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.sujet}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7, marginTop: 3 }}>{timeAgo(g.generatedAt)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
