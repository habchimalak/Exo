import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function QuizPublic() {
  const { token } = useParams();

  const [step, setStep] = useState('identity'); // identity | quiz | result
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [reponses, setReponses] = useState({});   // { questionId: choix }
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Charger le quiz
  useEffect(() => {
    fetch(`/api/quiz/public/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Quiz introuvable ou lien invalide');
        return res.json();
      })
      .then(data => setQuiz(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = (e) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;
    setStep('quiz');
  };

  const handleChoix = (questionId, choix) => {
    setReponses(prev => ({ ...prev, [questionId]: choix }));
  };

  const handleNext = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions ont une réponse
    const unanswered = quiz.questions.filter(q => !reponses[q.id]);
    if (unanswered.length > 0) {
      alert(`Vous n'avez pas répondu à ${unanswered.length} question(s).`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        reponses: Object.entries(reponses).map(([questionId, choix]) => ({
          questionId: Number(questionId),
          choix,
        })),
      };

      const res = await fetch(`/api/quiz/public/${token}/soumettre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur lors de la soumission');
      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: '#8888aa', marginTop: 16 }}>Chargement du quiz...</p>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <h2 style={{ color: '#e17055' }}>{error}</h2>
      <p style={{ color: '#8888aa' }}>Vérifiez que le lien est correct.</p>
    </div>
  );

  // ── Étape 1 : Identité ────────────────────────────────────────────────────
  if (step === 'identity') return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>ExoCraft</div>
        <h1 style={styles.title}>{quiz.titre}</h1>
        <p style={styles.meta}>
          <span style={styles.badge}>{quiz.matiere}</span>
          <span style={styles.badge}>{quiz.niveau}</span>
          <span style={styles.badge}>{quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}</span>
        </p>
        <p style={{ color: '#69647b', fontSize: 14, marginBottom: 28 }}>
          Entrez votre nom et prénom pour commencer.
        </p>
        <form onSubmit={handleStart}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Prénom *</label>
            <input style={styles.input} value={prenom} onChange={e => setPrenom(e.target.value)}
              placeholder="Votre prénom" required autoFocus />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom *</label>
            <input style={styles.input} value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Votre nom" required />
          </div>
          <button type="submit" style={styles.btnPrimary}>
            Commencer le quiz →
          </button>
        </form>
      </div>
    </div>
  );

  // ── Étape 2 : Quiz ────────────────────────────────────────────────────────
  if (step === 'quiz') {
    const q = quiz.questions[currentQ];
    const total = quiz.questions.length;
    const answeredCount = Object.keys(reponses).length;
    const progress = (answeredCount / total) * 100;
    const isLast = currentQ === total - 1;

    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 680 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={styles.logo}>ExoCraft</div>
            <span style={{ fontSize: 13, color: '#8888aa', fontWeight: 600 }}>
              {prenom} {nom}
            </span>
          </div>

          {/* Titre */}
          <h2 style={{ fontSize: 16, color: '#4c416d', margin: '0 0 8px' }}>{quiz.titre}</h2>

          {/* Barre de progression */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8888aa', marginBottom: 6 }}>
              <span>Question {currentQ + 1} / {total}</span>
              <span>{answeredCount} répondue{answeredCount > 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f8', borderRadius: 3 }}>
              <div style={{ height: '100%', background: '#6c5ce7', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Question */}
          <div style={{ background: '#f8f7ff', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a3e', lineHeight: 1.6, margin: 0 }}>
              {currentQ + 1}. {q.enonce}
            </p>
          </div>

          {/* Choix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {['A', 'B', 'C', 'D'].map(letter => {
              const choixKey = `choix${letter}`;
              const selected = reponses[q.id] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => handleChoix(q.id, letter)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selected ? '#6c5ce7' : '#e0ddf0'}`,
                    background: selected ? '#f0edff' : '#fff',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: selected ? '#6c5ce7' : '#f0edff',
                    color: selected ? '#fff' : '#6c5ce7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                  }}>{letter}</span>
                  <span style={{ fontSize: 14, color: selected ? '#3d2e8e' : '#292642', fontWeight: selected ? 600 : 400 }}>
                    {q[choixKey]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handlePrev} disabled={currentQ === 0}
              style={{ ...styles.btnSecondary, opacity: currentQ === 0 ? 0.4 : 1 }}>
              ← Précédent
            </button>

            {isLast ? (
              <button onClick={handleSubmit} disabled={submitting || answeredCount < total}
                style={{ ...styles.btnPrimary, flex: 1, opacity: answeredCount < total ? 0.6 : 1 }}>
                {submitting ? 'Envoi...' : '✓ Soumettre mes réponses'}
              </button>
            ) : (
              <button onClick={handleNext} style={{ ...styles.btnPrimary, flex: 1 }}>
                Suivant →
              </button>
            )}
          </div>

          {answeredCount < total && isLast && (
            <p style={{ textAlign: 'center', color: '#e17055', fontSize: 12, marginTop: 10 }}>
              ⚠ {total - answeredCount} question{total - answeredCount > 1 ? 's' : ''} sans réponse
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Étape 3 : Résultat ────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const noteColor = result.pourcentage >= 80 ? '#00b894' : result.pourcentage >= 50 ? '#f39c12' : '#e17055';
    const mention = result.pourcentage >= 80 ? '🎉 Excellent !' : result.pourcentage >= 50 ? '👍 Bien !' : '📚 À revoir';

    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 600, textAlign: 'center' }}>
          <div style={styles.logo}>ExoCraft</div>

          <div style={{ fontSize: 56, margin: '16px 0 8px' }}>
            {result.pourcentage >= 80 ? '🏆' : result.pourcentage >= 50 ? '✅' : '📖'}
          </div>

          <h2 style={{ fontSize: 22, color: '#1a1a3e', margin: '0 0 4px' }}>
            {result.prenom} {result.nom}
          </h2>
          <p style={{ color: '#8888aa', fontSize: 14, marginBottom: 24 }}>{quiz.titre}</p>

          {/* Note */}
          <div style={{ background: '#f8f7ff', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: noteColor, lineHeight: 1 }}>
              {result.note}<span style={{ fontSize: 24 }}>/20</span>
            </div>
            <div style={{ fontSize: 16, color: '#69647b', marginTop: 8 }}>
              {result.score} bonne{result.score > 1 ? 's' : ''} réponse{result.score > 1 ? 's' : ''} sur {result.total}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: noteColor, marginTop: 12 }}>
              {mention}
            </div>
          </div>

          {/* Détail des réponses */}
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, color: '#4c416d', marginBottom: 12 }}>Détail des réponses</h3>
            {result.detail.map((d, i) => {
              const q = quiz.questions.find(q => q.id === d.questionId);
              return (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 10, marginBottom: 8,
                  border: `1.5px solid ${d.correct ? '#00b894' : '#e17055'}`,
                  background: d.correct ? '#f0fdf9' : '#fff5f5',
                }}>
                  <div style={{ fontSize: 13, color: '#1a1a3e', fontWeight: 600, marginBottom: 6 }}>
                    {i + 1}. {q?.enonce}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                    <span style={{ color: d.correct ? '#00b894' : '#e17055', fontWeight: 700 }}>
                      {d.correct ? '✓' : '✗'} Votre réponse : {d.choix}
                    </span>
                    {!d.correct && (
                      <span style={{ color: '#00b894', fontWeight: 700 }}>
                        ✓ Bonne réponse : {d.bonneReponse}
                      </span>
                    )}
                  </div>
                  {d.explication && (
                    <div style={{ fontSize: 12, color: '#69647b', marginTop: 4, fontStyle: 'italic' }}>
                      💡 {d.explication}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ color: '#8888aa', fontSize: 13 }}>
            Résultat envoyé à votre enseignant.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0eeff 0%, #e8f4ff 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '36px 40px',
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 8px 32px rgba(108,92,231,0.12)',
  },
  centered: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#f8f7ff',
  },
  logo: {
    fontSize: 18, fontWeight: 900, color: '#6c5ce7',
    letterSpacing: -0.5, marginBottom: 20,
  },
  title: {
    fontSize: 24, fontWeight: 800, color: '#1a1a3e',
    margin: '0 0 12px', lineHeight: 1.3,
  },
  meta: {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
  },
  badge: {
    padding: '4px 12px', borderRadius: 20,
    background: '#f0edff', color: '#6c5ce7',
    fontSize: 12, fontWeight: 600,
  },
  formGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontWeight: 600, fontSize: 13,
    color: '#45405f', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #dcd9e7', borderRadius: 10,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    color: '#292642', background: '#fff',
  },
  btnPrimary: {
    width: '100%', padding: '14px',
    background: '#6c5ce7', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 8, transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '12px 20px',
    background: '#f0edff', color: '#6c5ce7',
    border: '1.5px solid #dcd9e7', borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  spinner: {
    width: 40, height: 40,
    border: '3px solid #e0ddf0',
    borderTopColor: '#6c5ce7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
