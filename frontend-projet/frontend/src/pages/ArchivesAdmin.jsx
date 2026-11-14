import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { quizApi, contentApi, archiveApi } from '../services/api';

export default function ArchivesAdmin() {

  /* ── Onglets ─────────────────────────────────────── */
  const [tab, setTab] = useState('quiz'); // 'quiz' | 'contenus'

  /* ── Quiz archivés ───────────────────────────────── */
  const [archivedQuizzes, setArchivedQuizzes]   = useState([]);
  const [quizTotal, setQuizTotal]               = useState(0);
  const [quizPage,  setQuizPage]                = useState(1);

  /* ── Contenus archivés ───────────────────────────── */
  const [archivedContents, setArchivedContents] = useState([]);
  const [contentsTotal,    setContentsTotal]    = useState(0);
  const [contentsPage,     setContentsPage]     = useState(1);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [notice,  setNotice]  = useState('');

  const LIMIT = 10;

  /* ── Chargements ─────────────────────────────────── */
  const loadArchivedQuizzes = async () => {
    setLoading(true); setError('');
    try {
      const r = await quizApi.getArchived({ page: quizPage, limit: LIMIT });
      setArchivedQuizzes(r.data  ?? []);
      setQuizTotal(r.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadArchivedContents = async () => {
    setLoading(true); setError('');
    try {
      const r = await contentApi.getArchived({ page: contentsPage, limit: LIMIT });
      setArchivedContents(r.data  ?? []);
      setContentsTotal(r.total ?? 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'quiz')     loadArchivedQuizzes();   }, [quizPage,     tab]);
  useEffect(() => { if (tab === 'contenus') loadArchivedContents();  }, [contentsPage, tab]);

  /* ── Actions ─────────────────────────────────────── */
  const desarchiverQuiz = async (id) => {
    try {
      await quizApi.desarchiver(id);
      setNotice('Quiz restauré dans "Mes Exercices".');
      loadArchivedQuizzes();
    } catch (err) { alert(err.message); }
  };

  const supprimerQuiz = async (id) => {
    if (!window.confirm('Supprimer définitivement ce quiz archivé ?')) return;
    try { await quizApi.remove(id); loadArchivedQuizzes(); }
    catch (err) { alert(err.message); }
  };

  const desarchiverContent = async (id) => {
    try {
      await contentApi.desarchiver(id);
      setNotice('Contenu restauré dans "Mes Cours".');
      loadArchivedContents();
    } catch (err) { alert(err.message); }
  };

  const supprimerContent = async (id) => {
    if (!window.confirm('Supprimer définitivement ce contenu archivé ?')) return;
    try { await contentApi.remove(id); loadArchivedContents(); }
    catch (err) { alert(err.message); }
  };

  const quizTotalPages = Math.max(1, Math.ceil(quizTotal     / LIMIT));
  const contTotalPages = Math.max(1, Math.ceil(contentsTotal / LIMIT));

  /* ── Pagination ─────────────────────────────────── */
  const Pagination = ({ page, total, onPrev, onNext }) => (
    total > 1 ? (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, alignItems: 'center' }}>
        <button className="workspace-button secondary" onClick={onPrev} disabled={page <= 1}>← Précédent</button>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          Page {page} / {total}
        </span>
        <button className="workspace-button secondary" onClick={onNext} disabled={page >= total}>Suivant →</button>
      </div>
    ) : null
  );

  /* ── Rendu ───────────────────────────────────────── */
  return (
    <DashboardLayout activePage="archives">

      {/* En-tête */}
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">ARCHIVES</span>
          <h1>Archives</h1>
          <p>Restaurez ou supprimez vos quiz et contenus archivés.</p>
        </div>
      </div>

      {/* Messages */}
      {notice && <div className="workspace-notice" role="status">{notice}</div>}
      {error  && <div className="workspace-error"  role="alert">{error}</div>}

      {/* ── Onglets ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 28,
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.75)',
        borderRadius: 16, padding: 5,
        width: 'fit-content',
      }}>
        {[
          { key: 'quiz',     label: 'Quiz archivés',     count: quizTotal      },
          { key: 'contenus', label: 'Contenus archivés', count: contentsTotal  },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 12, border: 'none',
              background: tab === key
                ? 'linear-gradient(135deg,#2563EB,#4F46E5)'
                : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-secondary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: tab === key ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                background: tab === key ? 'rgba(255,255,255,0.25)' : 'rgba(37,99,235,0.12)',
                color: tab === key ? '#fff' : 'var(--color-primary)',
                borderRadius: 20, padding: '1px 8px',
                fontSize: 11, fontWeight: 700,
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Chargement ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
          Chargement…
        </div>
      )}

      {/* ══════════════════ QUIZ ARCHIVÉS ══════════════════ */}
      {!loading && tab === 'quiz' && (
        <>
          {archivedQuizzes.length === 0 ? (
            <div className="workspace-empty">
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20, fontWeight: 800, color: 'var(--color-primary)',
              }}>0</div>
              <h3>Aucun quiz archivé</h3>
              <p>Les quiz archivés depuis "Mes Exercices" apparaîtront ici.</p>
            </div>
          ) : (
            <div className="workspace-cards">
              {archivedQuizzes.map((q) => (
                <div key={q.id} className="workspace-card">
                  <div className="workspace-card-top">
                    <span className="workspace-badge">{q.matiere}</span>
                    {q.niveau && <span className="workspace-badge">{q.niveau}</span>}
                    <span className="workspace-badge" style={{
                      background: 'rgba(37,99,235,0.08)',
                      color: 'var(--color-primary)',
                    }}>Archivé</span>
                  </div>
                  <h3>{q.titre}</h3>
                  {q.theme && <p>{q.theme}</p>}
                  <small>
                    Archivé le {q.archivedAt
                      ? new Date(q.archivedAt).toLocaleDateString('fr-FR')
                      : '—'}
                  </small>
                  <div className="workspace-card-actions">
                    <button className="restore" onClick={() => desarchiverQuiz(q.id)}>
                      Restaurer
                    </button>
                    <button className="delete" onClick={() => supprimerQuiz(q.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            page={quizPage} total={quizTotalPages}
            onPrev={() => setQuizPage(p => Math.max(1, p - 1))}
            onNext={() => setQuizPage(p => Math.min(quizTotalPages, p + 1))}
          />
        </>
      )}

      {/* ══════════════════ CONTENUS ARCHIVÉS ══════════════════ */}
      {!loading && tab === 'contenus' && (
        <>
          {archivedContents.length === 0 ? (
            <div className="workspace-empty">
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20, fontWeight: 800, color: 'var(--color-primary)',
              }}>0</div>
              <h3>Aucun contenu archivé</h3>
              <p>Les contenus archivés depuis "Mes Cours" apparaîtront ici.</p>
            </div>
          ) : (
            <div className="workspace-cards">
              {archivedContents.map((c) => (
                <div key={c.id} className="workspace-card">
                  <div className="workspace-card-top">
                    {c.type    && <span className="workspace-badge">{c.type}</span>}
                    {c.matiere && <span className="workspace-badge">{c.matiere}</span>}
                    <span className="workspace-badge" style={{
                      background: 'rgba(37,99,235,0.08)',
                      color: 'var(--color-primary)',
                    }}>Archivé</span>
                  </div>
                  <h3>{c.titre}</h3>
                  {c.theme && <p>{c.theme}</p>}
                  <small>
                    Archivé le {c.archivedAt
                      ? new Date(c.archivedAt).toLocaleDateString('fr-FR')
                      : '—'}
                  </small>
                  <div className="workspace-card-actions">
                    <button className="restore" onClick={() => desarchiverContent(c.id)}>
                      Restaurer
                    </button>
                    <button className="delete" onClick={() => supprimerContent(c.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            page={contentsPage} total={contTotalPages}
            onPrev={() => setContentsPage(p => Math.max(1, p - 1))}
            onNext={() => setContentsPage(p => Math.min(contTotalPages, p + 1))}
          />
        </>
      )}
    </DashboardLayout>
  );
}
