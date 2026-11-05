import React, { useState, useEffect, useCallback } from 'react'
import { promosApi } from '../../services/adminApi'
import { useEtab } from '../../context/EtablissementContext'

// ── Spécialités disponibles ──────────────────────────────────────────────────
const SPECIALITES_DEFAULT = [
  'Cybersécurité',
  'Data Science',
  'Cloud Computing',
  'Génie Logiciel',
]

// Abréviations pour la génération du code
const SPEC_ABBR = {
  'Cybersécurité':  'CYB',
  'Data Science':   'DS',
  'Cloud Computing':'CIM',
  'Génie Logiciel': 'GL',
}

const NIVEAU_NUM = { '1ere': '1', '2eme': '2', '3eme': '3', '4eme': '4', '5eme': '5' }

// Génère le code automatiquement : ING-4-CIM-B
function genCode(niveau, specialite, classe) {
  const n = NIVEAU_NUM[niveau] || '?'
  const sp = SPEC_ABBR[specialite] || specialite?.slice(0, 3).toUpperCase() || 'GEN'
  const cl = classe ? `-${classe.toUpperCase()}` : ''
  return `ING-${n}-${sp}${cl}`
}

// ── Formulaire promotion ─────────────────────────────────────────────────────
function PromoForm({ form, setForm, etabType }) {
  const [specialites, setSpecialites] = useState(SPECIALITES_DEFAULT)
  const [newSpec, setNewSpec] = useState('')
  const [showAddSpec, setShowAddSpec] = useState(false)

  // Mise à jour d'un champ + regénération du code si nécessaire
  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Régénérer le code automatiquement
      if (['niveau', 'specialite', 'classe'].includes(field)) {
        next.code = genCode(
          field === 'niveau'    ? value : next.niveau,
          field === 'specialite'? value : next.specialite,
          field === 'classe'    ? value : next.classe,
        )
      }
      return next
    })
  }

  // Ajouter une nouvelle spécialité
  const addSpec = () => {
    const spec = newSpec.trim()
    if (!spec || specialites.includes(spec)) return
    setSpecialites(prev => [...prev, spec])
    update('specialite', spec)
    setNewSpec('')
    setShowAddSpec(false)
  }

  const niveauOptions = etabType === 'licence'
    ? [
        { value: '1ere', label: '1ère Licence' },
        { value: '2eme', label: '2ème Licence' },
        { value: '3eme', label: '3ème Licence' },
        { value: '4eme', label: 'Master 1' },
        { value: '5eme', label: 'Master 2' },
      ]
    : [
        { value: '1ere', label: '1ère Prépa' },
        { value: '2eme', label: '2ème Prépa' },
        { value: '3eme', label: 'Branche commune' },
        { value: '4eme', label: '4ème année' },
        { value: '5eme', label: '5ème année' },
      ]

  // Afficher la spécialité uniquement si niveau 4ème ou 5ème (spécialité)
  const showSpec = form.type === 'specialite'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Nom complet */}
      <div className="form-group">
        <label className="form-label">Nom complet</label>
        <input className="input" value={form.nom}
          onChange={e => setForm(prev => ({ ...prev, nom: e.target.value }))}
          placeholder="Ex: 4ème année — Cloud Computing" />
      </div>

      {/* Type */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <select className="input" value={form.type}
          onChange={e => update('type', e.target.value)}>
          <option value="licence">Licence</option>
          <option value="cycle_ing">Cycle Ingénieur</option>
          <option value="master">Master</option>
          <option value="specialite">Spécialité</option>
          <option value="prepa">Prépa</option>
          <option value="branche_commune">Branche commune</option>
          <option value="general">Général</option>
        </select>
      </div>

      {/* Semestre */}
      <div className="form-group">
        <label className="form-label">Semestre</label>
        <select className="input" value={form.semestre}
          onChange={e => setForm(prev => ({ ...prev, semestre: e.target.value }))}>
          <option value="S1">Semestre 1</option>
          <option value="S2">Semestre 2</option>
          <option value="S1-S2">S1 + S2</option>
        </select>
      </div>

      {/* Niveau */}
      <div className="form-group">
        <label className="form-label">Niveau</label>
        <select className="input" value={form.niveau}
          onChange={e => update('niveau', e.target.value)}>
          {niveauOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Spécialité — visible si type = spécialité */}
      {showSpec && (
        <div className="form-group">
          <label className="form-label">Spécialité</label>
          <select className="input" value={form.specialite || ''}
            onChange={e => {
              if (e.target.value === '__new__') { setShowAddSpec(true); return }
              update('specialite', e.target.value)
            }}>
            <option value="">— Choisir une spécialité —</option>
            {specialites.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__new__">+ Ajouter une nouvelle spécialité...</option>
          </select>

          {/* Champ ajout nouvelle spécialité */}
          {showAddSpec && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="input" value={newSpec}
                onChange={e => setNewSpec(e.target.value)}
                placeholder="Ex: Intelligence Artificielle"
                onKeyDown={e => e.key === 'Enter' && addSpec()}
                autoFocus />
              <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}
                onClick={addSpec}>
                Ajouter
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setShowAddSpec(false); setNewSpec('') }}>
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Classe */}
      <div className="form-group">
        <label className="form-label">
          Classe <span style={{ fontSize: 11, color: '#9090b0', fontWeight: 400 }}>
            (ex: A, B, C — optionnel)
          </span>
        </label>
        <input className="input" value={form.classe || ''}
          onChange={e => update('classe', e.target.value)}
          placeholder="Ex: A, B, C..." />
      </div>

      {/* Code généré automatiquement */}
      <div className="form-group">
        <label className="form-label">
          Code généré
          <span style={{ fontSize: 11, color: '#9090b0', fontWeight: 400, marginLeft: 6 }}>
            (modifiable)
          </span>
        </label>
        <input className="input" value={form.code}
          onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
          style={{ fontFamily: 'monospace', background: '#f5f3ff', color: '#5b4fcf', fontWeight: 700 }} />
      </div>

    </div>
  )
}

const NIVEAU_CONFIG_ING = {
  '1ere': { label: '1ère Prépa',         color: '#5b4fcf', bg: '#edeaff' },
  '2eme': { label: '2ème Prépa',         color: '#4a90e2', bg: '#e6f0ff' },
  '3eme': { label: '3ème Branche comm.', color: '#00b894', bg: '#e0faf3' },
  '4eme': { label: '4ème année',         color: '#f39c12', bg: '#fff5e0' },
  '5eme': { label: '5ème année',         color: '#e17055', bg: '#fff0ee' },
}
const NIVEAU_CONFIG_LICENCE = {
  '1ere': { label: '1ère Licence', color: '#5b4fcf', bg: '#edeaff' },
  '2eme': { label: '2ème Licence', color: '#4a90e2', bg: '#e6f0ff' },
  '3eme': { label: '3ème Licence', color: '#00b894', bg: '#e0faf3' },
  '4eme': { label: 'Master 1',     color: '#f39c12', bg: '#fff5e0' },
  '5eme': { label: 'Master 2',     color: '#e17055', bg: '#fff0ee' },
}
const SPEC_COLORS = {
  'Cloud Computing': '#4a90e2', 'Cybersécurité': '#e17055',
  'Data Science': '#00b894', 'Génie Logiciel': '#5b4fcf',
}
function specColor(s) { return SPEC_COLORS[s] ?? '#5b4fcf' }

export default function Promos() {
  const { type: etabType, reload: reloadContext } = useEtab()
  const NIVEAU_CONFIG = etabType === 'licence' ? NIVEAU_CONFIG_LICENCE : NIVEAU_CONFIG_ING

  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ nom: '', code: '', niveau: '4eme', type: 'specialite', specialite: '', semestre: 'S1', classe: '' })
  const [alertMsg, setAlertMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPromos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await promosApi.list()
      setPromos(data)
    } catch (err) {
      console.error('Promos load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPromos() }, [loadPromos])

  const niveaux = ['1ere', '2eme', '3eme', '4eme', '5eme']

  function openCreate() {
    setEditItem(null)
    setForm({ nom: '', code: 'ING-4-GEN', niveau: '4eme', type: 'specialite', specialite: '', semestre: 'S1', classe: '' })
    setAlertMsg('')
    setShowModal(true)
  }

  function openEdit(p) {
    setEditItem(p)
    setForm({ nom: p.nom, code: p.code, niveau: p.niveau, type: p.type, specialite: p.specialite ?? '', semestre: p.semestre, classe: p.classe || '' })
    setAlertMsg('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.code.trim()) { setAlertMsg('Nom et code requis.'); return }
    setSaving(true); setAlertMsg('')
    try {
      const payload = {
        nom: form.nom, code: form.code, niveau: form.niveau,
        type: form.type, semestre: form.semestre,
        specialite: form.specialite || null,
        classe: form.classe || null,
      }
      if (editItem) {
        const updated = await promosApi.update(editItem.id, payload)
        setPromos(prev => prev.map(p => p.id === editItem.id ? updated : p))
        if (selectedPromo?.id === editItem.id) setSelectedPromo(updated)
      } else {
        const created = await promosApi.create(payload)
        setPromos(prev => [...prev, created])
      }
      reloadContext()
      setShowModal(false)
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette promotion ?')) return
    try {
      await promosApi.delete(id)
      setPromos(prev => prev.filter(p => p.id !== id))
      if (selectedPromo?.id === id) setSelectedPromo(null)
      reloadContext()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur suppression')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Promotions</div>
          <div className="page-subtitle">
            {loading ? 'Chargement...' : `${promos.length} promotion${promos.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle promotion</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
        {niveaux.map(n => {
          const cfg = NIVEAU_CONFIG[n]
          const count = promos.filter(p => p.niveau === n).length
          return (
            <div key={n} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${cfg.color}`, padding: '14px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 4, lineHeight: 1.3 }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#8888aa' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPromo ? '380px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
          <div>
            {niveaux.map(n => {
              const group = promos.filter(p => p.niveau === n)
              if (group.length === 0) return null
              const cfg = NIVEAU_CONFIG[n]
              return (
                <div key={n} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a3e' }}>{cfg.label}</div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{group.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.map(p => {
                      const sc = specColor(p.specialite ?? '')
                      const isSelected = selectedPromo?.id === p.id
                      return (
                        <div key={p.id} onClick={() => setSelectedPromo(isSelected ? null : p)}
                          style={{ background: isSelected ? '#f5f3ff' : '#fff', border: `1.5px solid ${isSelected ? '#5b4fcf' : '#e0e2f0'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f0f2f8', color: '#3a3a6a', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{p.code}</span>
                                <span style={{ fontSize: 10, background: '#f5f5f5', color: '#8888aa', padding: '1px 6px', borderRadius: 4 }}>{p.semestre}</span>
                                {p.specialite && <span style={{ fontSize: 10, background: sc + '18', color: sc, padding: '1px 8px', borderRadius: 4, fontWeight: 700 }}>{p.specialite}</span>}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? '#5b4fcf' : '#1a1a3e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 3 }}>{(p.matieres || []).length} matière{(p.matieres || []).length !== 1 ? 's' : ''}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <button className="btn-icon" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openEdit(p)}>Modifier</button>
                              <button className="btn-icon danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => handleDelete(p.id)}>Supp.</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {promos.length === 0 && (
              <div className="card">
                <div className="empty-state">
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#5b4fcf', opacity: 0.3, marginBottom: 12 }}>PROMO</div>
                  <div>Aucune promotion créée</div>
                </div>
              </div>
            )}
          </div>

          {selectedPromo && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={() => setSelectedPromo(null)} style={{ background: '#f0f2f8', border: '1px solid #e0e2f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#3a3a6a', fontWeight: 500 }}>Fermer</button>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a3e' }}>{selectedPromo.nom}</div>
                  <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#3a3a6a' }}>{selectedPromo.code}</span>
                    {selectedPromo.specialite && <> · <span style={{ color: specColor(selectedPromo.specialite), fontWeight: 600 }}>{selectedPromo.specialite}</span></>}
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e2f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="section-title">Matières — {selectedPromo.code}</div>
                  <span className="badge badge-purple">{(selectedPromo.matieres || []).length}</span>
                </div>
                {(selectedPromo.matieres || []).length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8888aa', fontSize: 13 }}>Aucune matière associée</div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    {(selectedPromo.matieres || []).map((mat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < selectedPromo.matieres.length - 1 ? '1px solid #f0f2ff' : 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#edeaff', color: '#5b4fcf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a3e' }}>{mat}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editItem ? 'Modifier' : 'Nouvelle promotion'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>X</button>
            </div>
            {alertMsg && <div className="alert alert-error">{alertMsg}</div>}

            <PromoForm
              form={form}
              setForm={setForm}
              etabType={etabType}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
