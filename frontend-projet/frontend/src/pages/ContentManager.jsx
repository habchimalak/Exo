import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { contentApi, exportApi } from '../services/api';
import useMatieres from '../hooks/useMatieres';

/* ============================================================
   CONTENT MANAGER  —  Mes Cours  (style Dashboard glassmorphism)
   ============================================================ */

const CONTENT_TYPES = [
  { value: '',       label: 'Tous les types' },
  { value: 'cours',  label: 'Cours'          },
  { value: 'resume', label: 'Résumé'         },
];

const COURSE_TYPES = [
  { value: 'cours',  label: 'Cours'   },
  { value: 'resume', label: 'Résumé'  },
];

// ── Formulaire création / édition ─────────────────────────
function ContentForm({ initial, onSaved, onCancel }) {
  const { user } = useAuth();
  const { matieres: mesMatieres, promos: mesPromos } = useMatieres();

  const classeOptions = user?.associations?.length
    ? [...new Set(user.associations.map(a =>
        `${a.className}${a.section !== 'Tronc commun' ? ' — ' + a.section : ''}`))]
    : [];

  const [form, setForm] = useState(
    initial
      ? { titre: initial.titre || '', type: initial.type || 'cours', matiere: initial.matiere || '', classe: initial.theme || (classeOptions[0] ?? ''), contenu: initial.contenu || '' }
      : { titre: '', type: 'cours', matiere: '', classe: classeOptions[0] ?? '', contenu: '' }
  );
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [extracting,  setExtracting]  = useState(false);
  const [extractedFile, setExtractedFile] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  const update = (e) => setForm(cur => ({ ...cur, [e.target.name]: e.target.value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('exocraft_token');
      const res = await fetch('/api/ai/extract-text', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Erreur extraction');
      const data = await res.json();
      setForm(cur => ({ ...cur, contenu: data.texte }));
      setExtractedFile(file.name);
      setPendingFile(file);
    } catch (err) { setError("Impossible d'extraire : " + err.message); }
    finally { setExtracting(false); e.target.value = ''; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, theme: form.classe };
      let contentId = initial?.id;
      if (initial?.id) {
        await contentApi.update(initial.id, payload);
      } else {
        const created = await contentApi.create(payload);
        contentId = created?.id;
      }
      if (pendingFile && contentId) await contentApi.uploadFichier(contentId, pendingFile);
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      border: '1px solid rgba(255,255,255,0.75)',
      borderRadius: 24, padding: 32, marginBottom: 28,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 2px 20px rgba(37,99,235,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          margin: 0, fontSize: 20, fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--text-primary)',
        }}>{initial?.id ? 'Modifier le cours' : 'Nouveau cours'}</h2>
        <button onClick={onCancel} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'rgba(37,99,235,0.08)', color: 'var(--text-secondary)',
          fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
        >×</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type de contenu */}
        {!initial?.id && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
              Type de contenu
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {COURSE_TYPES.map(t => (
                <label key={t.value} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                  border: form.type === t.value ? '1.5px solid #2563EB' : '1.5px solid rgba(37,99,235,0.18)',
                  background: form.type === t.value ? 'linear-gradient(135deg,#2563EB,#4F46E5)' : 'rgba(255,255,255,0.6)',
                  fontWeight: 700, fontSize: 13,
                  color: form.type === t.value ? '#fff' : 'var(--text-secondary)',
                  boxShadow: form.type === t.value ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={update} style={{ display: 'none' }} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Grille champs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { name: 'titre',  label: 'Titre *',    placeholder: 'Introduction aux algorithmes…' },
          ].map(f => (
            <div key={f.name} style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={update} placeholder={f.placeholder} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.14)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(37,99,235,0.18)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Matière *</label>
            {mesMatieres.length > 0 ? (
              <select name="matiere" value={form.matiere} onChange={update} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option value="">— Choisir —</option>
                {mesMatieres.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input name="matiere" value={form.matiere} onChange={update} placeholder="Informatique…" required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Classe *</label>
            {mesPromos.length > 0 ? (
              <select name="classe" value={form.classe} onChange={update} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option value="">— Choisir —</option>
                {mesPromos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : classeOptions.length > 0 ? (
              <select name="classe" value={form.classe} onChange={update} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {classeOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input name="classe" value={form.classe} onChange={update} placeholder="3ème A…" required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            )}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Contenu</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={extracting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                border: '1.5px dashed rgba(37,99,235,0.4)',
                background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {extracting ? 'Extraction…' : 'Importer un PDF ou Word'}
            </button>
            {extractedFile && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Importé : {extractedFile}</span>}
            {!extractedFile && initial?.fichierNom && (
              <a href={contentApi.fichierUrl(initial.id)} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                {initial.fichierNom}
              </a>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
          <textarea name="contenu" value={form.contenu} onChange={update}
            rows={form.contenu ? 16 : 10}
            placeholder="Rédigez ici, importez un PDF/Word ci-dessus, ou laissez vide…"
            style={{
              width: '100%', padding: '14px', border: '1.5px solid rgba(37,99,235,0.18)',
              borderRadius: 12, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)',
              fontSize: 13, lineHeight: 1.75, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', backdropFilter: 'blur(8px)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.14)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(37,99,235,0.18)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Export PDF/Word si édition */}
        {initial?.id && (
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            padding: '14px 18px', borderRadius: 14, marginBottom: 16,
            background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: 4 }}>Télécharger :</span>
            {[
              { label: 'PDF',  onClick: () => exportApi.download(exportApi.contentPdfUrl(initial.id)) },
              { label: 'Word', onClick: () => exportApi.download(exportApi.contentWordUrl(initial.id)) },
            ].map(btn => (
              <button key={btn.label} type="button" onClick={btn.onClick}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  border: '1.5px solid rgba(37,99,235,0.2)',
                  background: 'rgba(255,255,255,0.7)', color: 'var(--color-primary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--btn-primary-bg)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1.5px solid transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.border = '1.5px solid rgba(37,99,235,0.2)'; }}
              >{btn.label}</button>
            ))}
          </div>
        )}

        {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} style={{
            padding: '11px 28px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#2563EB,#4F46E5)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
            transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Enregistrement…' : initial?.id ? 'Enregistrer' : 'Créer le cours'}
          </button>
          <button type="button" onClick={onCancel} style={{
            padding: '11px 22px', borderRadius: 12,
            border: '1px solid rgba(37,99,235,0.2)',
            background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)',
            fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
          }}>Annuler</button>
        </div>
      </form>
    </div>
  );
}

// ── Vue lecture seule ─────────────────────────────────────
function ContentView({ item, onBack, onEdit }) {
  const typeColors = {
    cours:  { bg: 'rgba(6,182,212,0.10)',  color: '#06B6D4' },
    resume: { bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  };
  const tc = typeColors[item.type] || typeColors.cours;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: '1px solid rgba(37,99,235,0.2)',
          background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
        }}>← Retour</button>
        {onEdit && (
          <button onClick={onEdit} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#2563EB,#4F46E5)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
          }}>Modifier</button>
        )}
      </div>

      {/* Contenu glass */}
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(255,255,255,0.75)',
        borderRadius: 24, padding: 32,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 20px rgba(37,99,235,0.08)',
      }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color }}>{item.type}</span>
          {item.matiere && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)' }}>{item.matiere}</span>}
          {item.theme   && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(37,99,235,0.07)', color: 'var(--text-secondary)' }}>{item.theme}</span>}
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: item.statut === 'valide' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: item.statut === 'valide' ? '#059669' : '#D97706' }}>{item.statut}</span>
        </div>

        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          margin: '0 0 20px', fontSize: 24, fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--text-primary)',
        }}>{item.titre}</h2>

        {item.fichierNom && (
          <a href={contentApi.fichierUrl(item.id)} target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, marginBottom: 20,
              border: '1px solid rgba(37,99,235,0.2)',
              background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)',
              fontWeight: 600, fontSize: 12, textDecoration: 'none',
            }}>
            Télécharger le fichier original ({item.fichierNom})
          </a>
        )}

        <div style={{
          whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14,
          color: 'var(--text-secondary)',
          background: 'rgba(37,99,235,0.03)',
          border: '1px solid rgba(37,99,235,0.08)',
          borderRadius: 14, padding: '20px',
        }}>
          {item.contenu || <em style={{ color: 'var(--text-muted)' }}>Aucun contenu. Cliquez sur "Modifier" pour en ajouter.</em>}
        </div>
      </div>
    </div>
  );
}

// ── Carte contenu ─────────────────────────────────────────
function ContentCard({ item, onView, onEdit, onArchive, onDelete }) {
  const [hov, setHov] = useState(false);
  const typeColors = {
    cours:  { bg: 'rgba(6,182,212,0.10)',  color: '#06B6D4'  },
    resume: { bg: 'rgba(16,185,129,0.10)', color: '#059669'  },
  };
  const tc = typeColors[item.type] || typeColors.cours;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', padding: 22,
        background: hov ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.68)',
        border: `1px solid ${hov ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.75)'}`,
        borderRadius: 20,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hov ? '0 12px 36px rgba(37,99,235,0.14)' : '0 2px 14px rgba(37,99,235,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color }}>{item.type}</span>
        {item.theme && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(37,99,235,0.07)', color: 'var(--text-secondary)' }}>{item.theme}</span>}
        <span style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: item.statut === 'valide' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          color: item.statut === 'valide' ? '#059669' : '#D97706',
        }}>{item.statut}</span>
      </div>

      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        margin: '0 0 6px', fontSize: 15, fontWeight: 700,
        color: 'var(--text-primary)', lineHeight: 1.3, overflowWrap: 'anywhere',
      }}>{item.titre}</h3>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-secondary)' }}>{item.matiere}</p>
      <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
        {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      </small>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7, marginTop: 'auto', flexWrap: 'wrap' }}>
        <button onClick={() => onView(item.id)} style={{
          flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(37,99,235,0.28)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.28)'; }}
        >Voir</button>
        <button onClick={() => onEdit(item.id)} style={{
          flex: 1, padding: '8px 0', borderRadius: 10,
          border: '1px solid rgba(37,99,235,0.2)',
          background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.07)'}
        >Modifier</button>
        <button onClick={() => onArchive(item.id)} style={{
          padding: '8px 10px', borderRadius: 10,
          border: '1px solid rgba(37,99,235,0.14)',
          background: 'rgba(37,99,235,0.05)', color: 'var(--text-muted)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.color = '#D97706'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >Archiver</button>
        <button onClick={() => onDelete(item.id)} style={{
          padding: '8px 10px', borderRadius: 10,
          border: '1px solid rgba(239,68,68,0.15)',
          background: 'rgba(239,68,68,0.05)', color: '#DC2626',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#DC2626'; }}
        >Suppr.</button>
      </div>
    </article>
  );
}

// ── Page principale ───────────────────────────────────────
export default function ContentManager() {
  const { promos: mesPromos } = useMatieres();
  const classeOptions = mesPromos;

  const [panel, setPanel]       = useState(null); // null | 'view' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);

  const [items,       setItems]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [matiere,     setMatiere]     = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [classeFilter,setClasseFilter]= useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const LIMIT = 12;

  const loadContents = async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: LIMIT };
      if (typeFilter) params.type = typeFilter;
      const result = await contentApi.getMesContenus(params);
      let data = result.data ?? [];
      if (matiere.trim()) data = data.filter(c => c.matiere?.toLowerCase().includes(matiere.toLowerCase()) || c.titre?.toLowerCase().includes(matiere.toLowerCase()));
      if (classeFilter)   data = data.filter(c => c.theme?.toLowerCase().includes(classeFilter.toLowerCase()));
      setItems(data);
      setTotal(result.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadContents(); }, [page, typeFilter, classeFilter, matiere]);

  const handleArchive = async (id) => {
    if (!window.confirm('Archiver ce cours ?')) return;
    try { await contentApi.archiver(id); loadContents(); }
    catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce cours définitivement ?')) return;
    try { await contentApi.remove(id); loadContents(); }
    catch (err) { alert(err.message); }
  };

  const openView = async (id) => {
    try { const data = await contentApi.getOne(id); setSelected(data); setPanel('view'); }
    catch (err) { alert(err.message); }
  };

  const openEdit = async (id) => {
    try { const data = await contentApi.getOne(id); setSelected(data); setPanel('edit'); }
    catch (err) { alert(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* Stats rapides */
  const stats = {
    total:   items.length,
    cours:   items.filter(i => i.type === 'cours').length,
    resumes: items.filter(i => i.type === 'resume').length,
    valides: items.filter(i => i.statut === 'valide').length,
  };

  return (
    <DashboardLayout activePage="contents">

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #06B6D4 100%)',
        borderRadius: 24, padding: '32px 36px',
        marginBottom: 28, position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(37,99,235,0.28)',
      }}>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', border: '50px solid rgba(255,255,255,0.05)', right: -50, top: -110, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '28px solid rgba(255,255,255,0.04)', left: -30, bottom: -60, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 8 }}>MES CONTENUS</div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", margin: '0 0 8px', color: '#fff', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Mes Cours &amp; Résumés
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6 }}>
              {total} cours enregistré{total !== 1 ? 's' : ''}. Créez, modifiez et exportez vos supports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {panel === null && (
              <button onClick={() => setPanel('create')} style={{
                padding: '11px 24px', borderRadius: 12, border: 'none',
                background: '#fff', color: '#1565C0',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
              >+ Créer un cours</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {panel === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total',    value: stats.total,   gradient: 'linear-gradient(135deg,#2563EB,#4F46E5)' },
            { label: 'Cours',    value: stats.cours,   gradient: 'linear-gradient(135deg,#06B6D4,#2563EB)' },
            { label: 'Résumés',  value: stats.resumes, gradient: 'linear-gradient(135deg,#059669,#06B6D4)'  },
            { label: 'Validés',  value: stats.valides, gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)'  },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.75)',
              borderRadius: 18, padding: '18px 20px',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 2px 14px rgba(37,99,235,0.07)',
              transition: 'all 0.25s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 14px rgba(37,99,235,0.07)'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.gradient, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 30, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg,#2563EB,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {/* ── Formulaire création / édition ── */}
      {panel === 'create' && (
        <ContentForm initial={null}
          onSaved={() => { setPanel(null); loadContents(); }}
          onCancel={() => setPanel(null)} />
      )}
      {panel === 'edit' && selected && (
        <ContentForm initial={selected}
          onSaved={() => { setPanel(null); setSelected(null); loadContents(); }}
          onCancel={() => { setPanel(null); setSelected(null); }} />
      )}

      {/* ── Vue lecture ── */}
      {panel === 'view' && selected && (
        <ContentView item={selected}
          onBack={() => { setPanel(null); setSelected(null); }}
          onEdit={() => { setPanel('edit'); }} />
      )}

      {/* ── Liste ── */}
      {panel === null && (
        <div style={{
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(255,255,255,0.75)',
          borderRadius: 24, padding: 24,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 16px rgba(37,99,235,0.07)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Tous mes cours
              <span style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(37,99,235,0.08)', color: 'var(--color-primary)' }}>{items.length}</span>
            </h2>
          </div>

          {/* Filtres */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Matière', type: 'text', value: matiere, setter: (v) => { setMatiere(v); setPage(1); }, placeholder: 'Filtrer par matière…' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.14)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(37,99,235,0.18)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Type</label>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Classe</label>
              {classeOptions.length > 0 ? (
                <select value={classeFilter} onChange={e => { setClasseFilter(e.target.value); setPage(1); }}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option value="">Toutes les classes</option>
                  {classeOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input type="text" value={classeFilter} onChange={e => { setClasseFilter(e.target.value); setPage(1); }} placeholder="Filtrer…"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(37,99,235,0.18)', borderRadius: 10, background: 'rgba(255,255,255,0.80)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              )}
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Chargement…</div>}

          {!loading && items.length === 0 && (
            <div className="workspace-empty" style={{ background: 'transparent', border: '1.5px dashed rgba(37,99,235,0.2)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>0</div>
              <h3>Aucun cours trouvé</h3>
              <p>Créez votre premier cours ou générez-en un avec l'IA.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                <button className="workspace-button" onClick={() => setPanel('create')}>+ Créer un cours</button>
              </div>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
              {items.map(c => (
                <ContentCard key={c.id} item={c}
                  onView={openView} onEdit={openEdit}
                  onArchive={handleArchive} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                ← Précédent
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.07)', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                Suivant →
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
