import { useState, useEffect, useCallback } from 'react'
import { usersApi, formatDateTime, timeAgo } from '../../services/adminApi'

function getInitials(prenom, nom) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase()
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#2563EB,#4F46E5)',
  'linear-gradient(135deg,#06B6D4,#2563EB)',
  'linear-gradient(135deg,#059669,#06B6D4)',
  'linear-gradient(135deg,#D97706,#EF4444)',
  'linear-gradient(135deg,#7C3AED,#2563EB)',
  'linear-gradient(135deg,#4F46E5,#7C3AED)',
]

export default function Users() {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterRole,  setFilterRole]  = useState('tous')
  const [showModal,   setShowModal]   = useState(false)
  const [editUser,    setEditUser]    = useState(null)
  const [form,        setForm]        = useState({ nom: '', prenom: '', email: '', role: 'enseignant', status: 'actif', password: '' })
  const [formError,   setFormError]   = useState('')
  const [saving,      setSaving]      = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setUsers(await usersApi.list())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(u => {
    const matchSearch = `${u.nom||''} ${u.prenom||''} ${u.email||''}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'tous' || u.role === filterRole
    return matchSearch && matchRole
  })

  function openCreate() {
    setEditUser(null)
    setForm({ nom: '', prenom: '', email: '', role: 'enseignant', status: 'actif', password: '' })
    setFormError(''); setShowModal(true)
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({ nom: u.nom||'', prenom: u.prenom||'', email: u.email||'', role: u.role, status: u.status, password: '' })
    setFormError(''); setShowModal(true)
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) { setFormError('Veuillez remplir tous les champs.'); return }
    setSaving(true); setFormError('')
    try {
      if (editUser) {
        const updated = await usersApi.update(editUser.id, { nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, status: form.status })
        setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u))
      } else {
        const created = await usersApi.create({ nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, status: form.status, password: form.password || undefined })
        setUsers(prev => [created, ...prev])
      }
      setShowModal(false)
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Erreur') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    const target = users.find(u => u.id === id)
    if (target?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) { alert('Impossible de supprimer le dernier administrateur.'); return }
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    try { await usersApi.delete(id); setUsers(prev => prev.filter(u => u.id !== id)) }
    catch (err) { alert(err instanceof Error ? err.message : 'Erreur') }
  }

  async function toggleStatus(u) {
    try {
      const result = await usersApi.toggleStatus(u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: result.status } : x))
    } catch (err) { alert(err instanceof Error ? err.message : 'Erreur') }
  }

  async function promoteToAdmin(u) {
    if (!window.confirm(`Promouvoir ${u.prenom} ${u.nom} en administrateur ?`)) return
    try {
      const result = await usersApi.promote(u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: result.role } : x))
    } catch (err) { alert(err instanceof Error ? err.message : 'Erreur') }
  }

  const enseignants = users.filter(u => u.role === 'enseignant').length
  const admins      = users.filter(u => u.role === 'admin').length

  /* ── Input helper ── */
  const Field = ({ label, children }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Utilisateurs</div>
          <div className="page-subtitle">
            {loading ? 'Chargement…' : `${enseignants} enseignant${enseignants > 1 ? 's' : ''} · ${admins} administrateur${admins > 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>

      {/* Stat rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total',         value: users.length, gradient: 'linear-gradient(135deg,#2563EB,#4F46E5)' },
          { label: 'Enseignants',   value: enseignants,  gradient: 'linear-gradient(135deg,#06B6D4,#2563EB)' },
          { label: 'Administrateurs', value: admins,     gradient: 'linear-gradient(135deg,#059669,#06B6D4)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.gradient, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 900, lineHeight: 1, background: s.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <input className="input" placeholder="Rechercher un utilisateur…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 14 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="tous">Tous les rôles</option>
          <option value="enseignant">Enseignants</option>
          <option value="admin">Admins</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 600 }}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th>Contenus</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--accent)', opacity: 0.3 }}>USR</div>
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}>
                        {getInitials(u.prenom, u.nom)}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{u.prenom} {u.nom}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Enseignant'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'actif' ? 'badge-green' : 'badge-red'}`}>
                      {u.status === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateTime(u.created_at)}
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{timeAgo(u.created_at)}</div>
                  </td>
                  <td style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                    {u.contentsCount ?? 0}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(u)}>Modifier</button>
                      <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleStatus(u)}>
                        {u.status === 'actif' ? 'Désactiver' : 'Activer'}
                      </button>
                      {u.role === 'enseignant' && (
                        <button className="btn-icon" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => promoteToAdmin(u)}>
                          Admin
                        </button>
                      )}
                      <button className="btn-icon danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(u.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center' }}>×</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prénom"><input className="input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" /></Field>
              <Field label="Nom"><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" /></Field>
            </div>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" /></Field>
            {!editUser && (
              <Field label="Mot de passe (optionnel)"><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Laisser vide pour le mot de passe par défaut" /></Field>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Rôle">
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="enseignant">Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </Field>
              <Field label="Statut">
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : editUser ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
