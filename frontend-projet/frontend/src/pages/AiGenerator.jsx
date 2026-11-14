import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth, defaultGroups } from "../context/AuthContext";
import { aiApi, exportApi, paymentApi } from "../services/api";
import useMatieres from "../hooks/useMatieres";

const CONTENT_TYPES = [
  { value: "quiz",   label: "Quiz",              icon: "☑" },
  { value: "cours",  label: "Cours",             icon: "📘" },
  { value: "resume", label: "Résumé",            icon: "📄" },
  { value: "serie",  label: "Série d'exercices", icon: "✎" },
  { value: "examen", label: "Examen",            icon: "📋" },
];

const NIVEAUX = [
  { value: "debutant",      label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance",        label: "Avancé" },
];

// ── Compteur crédits IA ──────────────────────────────────────────────────────
function CreditsCounter({ credits, loading }) {
  if (loading) return null;

  const pct = credits === null ? 0 : Math.min(100, (credits / 50) * 100); // 50 = quota de référence
  const isEmpty  = credits === 0;
  const isLow    = credits > 0 && credits <= 5;
  const isOk     = credits > 5;

  const color = isEmpty ? "#EF4444" : isLow ? "#F59E0B" : "#2563EB";
  const bgColor = isEmpty
    ? "rgba(239,68,68,0.08)"
    : isLow
    ? "rgba(245,158,11,0.08)"
    : "rgba(37,99,235,0.07)";
  const borderColor = isEmpty
    ? "rgba(239,68,68,0.25)"
    : isLow
    ? "rgba(245,158,11,0.25)"
    : "rgba(37,99,235,0.18)";

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 16, padding: "16px 20px",
      marginBottom: 24,
      display: "flex", alignItems: "center", gap: 16,
      backdropFilter: "blur(12px)",
    }}>
      {/* Icône / pastille */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: isEmpty
          ? "rgba(239,68,68,0.12)"
          : isLow
          ? "rgba(245,158,11,0.12)"
          : "rgba(37,99,235,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 18, color,
      }}>
        {isEmpty ? "0" : credits}
      </div>

      {/* Texte + barre */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 20, fontWeight: 800, color,
          }}>
            {credits ?? "—"} crédit{credits !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            disponible{credits !== 1 ? "s" : ""} pour la génération IA
          </span>
        </div>

        {/* Barre de progression */}
        <div style={{
          height: 6, borderRadius: 4,
          background: "rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: `${pct}%`,
            background: isEmpty
              ? "#EF4444"
              : isLow
              ? "linear-gradient(90deg,#F59E0B,#EF4444)"
              : "linear-gradient(90deg,#2563EB,#06B6D4)",
            transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
          }} />
        </div>

        {/* Message état */}
        <div style={{ marginTop: 5, fontSize: 12, color, fontWeight: 600 }}>
          {isEmpty && "Plus de crédits — rechargez pour continuer à générer."}
          {isLow  && `Attention : il ne vous reste que ${credits} crédit${credits > 1 ? "s" : ""}.`}
          {isOk   && `Chaque génération consomme 1 crédit.`}
        </div>
      </div>

      {/* Bouton recharger */}
      {(isEmpty || isLow) && (
        <a href="/pricing" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 18px", borderRadius: 10, border: "none",
          background: color === "#EF4444"
            ? "linear-gradient(135deg,#EF4444,#F87171)"
            : "linear-gradient(135deg,#F59E0B,#FBBF24)",
          color: "#fff", fontWeight: 700, fontSize: 12,
          textDecoration: "none", flexShrink: 0,
          boxShadow: `0 4px 14px ${color}40`,
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}>
          Recharger →
        </a>
      )}
    </div>
  );
}

// ── Chat IA ──────────────────────────────────────────────────────────────────
function AiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis ExoCraft IA. Posez-moi une question ou demandez-moi de générer un contenu pédagogique." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const historique = messages.slice(1);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await aiApi.chat(userMsg.content, historique);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reponse }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat-section">
      <div className="ai-chat-heading">
        <span className="dashboard-eyebrow">ASSISTANT IA</span>
        <h2>Chat avec ExoCraft IA</h2>
        <p>Posez des questions libres ou demandez de l'aide pour créer du contenu.</p>
      </div>
      <div className="ai-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ai-message--${msg.role}`}>
            <span className="ai-message-avatar">{msg.role === "assistant" ? "🤖" : "👤"}</span>
            <div className="ai-message-bubble">
              <pre className="ai-message-text">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message--assistant">
            <span className="ai-message-avatar">🤖</span>
            <div className="ai-message-bubble ai-message-typing">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="ai-chat-form" onSubmit={send}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..." disabled={loading} autoFocus />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Envoyer →"}
        </button>
      </form>
    </section>
  );
}

// ── Panneau d'export ─────────────────────────────────────────────────────────
function ExportPanel({ form, editedContent }) {
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg]             = useState("");

  const doExport = async (format, avecCorrige) => {
    setExporting(true); setMsg("");
    const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
    try {
      if (format === "pdf") {
        await exportApi.directPdf({ titre, matiere: form.matiere, theme: form.theme, type: form.type, contenu: editedContent, avecCorrige });
      } else {
        await exportApi.directWord({ titre, matiere: form.matiere, theme: form.theme, type: form.type, contenu: editedContent, avecCorrige });
      }
      setMsg(`✓ ${format.toUpperCase()} ${avecCorrige ? "avec corrigé" : "sans corrigé"} téléchargé.`);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ai-export-panel">
      <h3 className="ai-export-title">📥 Télécharger le contenu</h3>

      {/* Pour les étudiants — sans corrigé */}
      <div className="ai-export-group">
        <div className="ai-export-group-label">
          <span className="ai-export-badge ai-export-badge--student">👨‍🎓 Version étudiants</span>
          <small>Sans les réponses correctes</small>
        </div>
        <div className="ai-export-buttons">
          <button
            className="ai-export-btn ai-export-btn--pdf"
            onClick={() => doExport("pdf", false)}
            disabled={exporting}
          >
            📄 PDF
          </button>
          <button
            className="ai-export-btn ai-export-btn--word"
            onClick={() => doExport("word", false)}
            disabled={exporting}
          >
            📝 Word
          </button>
        </div>
      </div>

      {/* Pour le professeur — avec corrigé */}
      <div className="ai-export-group">
        <div className="ai-export-group-label">
          <span className="ai-export-badge ai-export-badge--prof">👨‍🏫 Version professeur</span>
          <small>Avec les réponses et explications</small>
        </div>
        <div className="ai-export-buttons">
          <button
            className="ai-export-btn ai-export-btn--pdf"
            onClick={() => doExport("pdf", true)}
            disabled={exporting}
          >
            📄 PDF + Corrigé
          </button>
          <button
            className="ai-export-btn ai-export-btn--word"
            onClick={() => doExport("word", true)}
            disabled={exporting}
          >
            📝 Word + Corrigé
          </button>
        </div>
      </div>

      {exporting && <p className="ai-export-status">⏳ Génération du fichier...</p>}
      {msg && <p className={`ai-export-status${msg.startsWith("❌") ? " error" : ""}`}>{msg}</p>}
    </div>
  );
}

// ── Générateur ───────────────────────────────────────────────────────────────
function AiGeneratorForm() {
  const [searchParams] = useSearchParams();
  const archiveId = searchParams.get('archiveId');
  const { matieres: mesMatieres, promos: mesPromos } = useMatieres();

  const [form, setForm] = useState({
    type: "quiz", matiere: "", theme: "", courseFourni: "",
    nombreQuestions: 5, niveau: "intermediaire",
    duree: "2 heures", bareme: "20 points", classe: "",
  });
  const [generated, setGenerated] = useState("");
  const [editedContent, setEdited] = useState("");
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedFileName, setExtractedFileName] = useState("");
  const fileInputRef = useRef(null);

  // ── Crédits ──
  const [credits, setCredits]       = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    paymentApi.myCredits()
      .then(d => setCredits(d.credits))
      .catch(() => setCredits(null))
      .finally(() => setCreditsLoading(false));
  }, []);

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  // Upload et extraction de texte depuis PDF/Word
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("exocraft_token");
      const res = await fetch("/api/ai/extract-text", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur extraction");
      }
      const data = await res.json();
      setForm((cur) => ({ ...cur, courseFourni: data.texte }));
      setExtractedFileName(file.name);
    } catch (err) {
      setError("Impossible d'extraire le texte : " + err.message);
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  // Génération
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.matiere.trim() || !form.theme.trim()) {
      setError("La matière et le thème sont obligatoires."); return;
    }
    setError(""); setSuccess(""); setGenerated(""); setEdited("");
    setLoading(true);
    try {
      const payload = {
        matiere: form.matiere, type: form.type, theme: form.theme,
        ...(form.courseFourni.trim() ? { courseFourni: form.courseFourni } : {}),
        ...(form.type === "quiz"   ? { nombreQuestions: +form.nombreQuestions, niveau: form.niveau } : {}),
        ...(form.type === "examen" ? { duree: form.duree, bareme: form.bareme } : {}),
      };
      const data = archiveId ? await aiApi.generateFromArchive(archiveId, payload) : await aiApi.generate(payload);
      setGenerated(data.contenu);
      setEdited(data.contenu);
      // Décrémenter le compteur local
      setCredits(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder en brouillon
  const handleSave = async () => {
    if (!editedContent.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
      await aiApi.save({ titre, type: form.type, matiere: form.matiere, theme: form.theme, contenu: editedContent });
      const isQuizType = ["quiz", "serie", "examen"].includes(form.type);
      setSuccess(
        isQuizType
          ? "✓ Sauvegardé en brouillon. Retrouvez-le dans \"Mes Exercices\"."
          : "✓ Sauvegardé en brouillon. Retrouvez-le dans \"Mes Cours\"."
      );
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  // Valider
  const handleValidate = async () => {
    if (!editedContent.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const titre = `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} — ${form.theme}`;
      await aiApi.save({ titre, type: form.type, matiere: form.matiere, theme: form.theme, contenu: editedContent });
      const isQuizType = ["quiz", "serie", "examen"].includes(form.type);
      setSuccess(
        isQuizType
          ? "✓ Enregistré dans \"Mes Exercices\" ! Vous pouvez y ajouter des questions."
          : "✓ Enregistré dans \"Mes Cours\" ! Vous pouvez le valider depuis là-bas."
      );
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="ai-generator-section">
      <div className="ai-generator-heading">
        <span className="dashboard-eyebrow">GÉNÉRATION IA</span>
        <h2>Générer un contenu pédagogique</h2>
        <p>Choisissez un type, saisissez une matière et un thème. L'IA génère le contenu en quelques secondes.</p>
      </div>

      {archiveId && (
        <div className="workspace-notice" role="status">
          📎 Génération depuis l'archive #{archiveId} — le contenu sera basé sur ce document.
        </div>
      )}

      {/* Compteur crédits */}
      <CreditsCounter credits={credits} loading={creditsLoading} />

      <form className="ai-generator-form" onSubmit={handleGenerate}>

        {/* Sélecteur de type */}
        <div className="ai-type-selector">
          {CONTENT_TYPES.map((t) => (
            <label key={t.value} className={`ai-type-card${form.type === t.value ? " active" : ""}`}>
              <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={update} />
              <span className="ai-type-icon">{t.icon}</span>
              <span>{t.label}</span>
            </label>
          ))}
        </div>

        {/* Matière + Thème + Classe */}
        <div className="ai-form-grid">
          <div className="form-group">
            <label htmlFor="matiere">Matière *</label>
            {mesMatieres.length > 0 ? (
              <select id="matiere" name="matiere" value={form.matiere} onChange={update} required>
                <option value="">— Choisir une matière —</option>
                {mesMatieres.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input id="matiere" name="matiere" value={form.matiere} onChange={update}
                placeholder="Ex: Informatique, Mathématiques..." required />
            )}
          </div>
          <div className="form-group">
            <label htmlFor="theme">Thème *</label>
            <input id="theme" name="theme" value={form.theme} onChange={update}
              placeholder="Ex: Les algorithmes de tri..." required />
          </div>
        </div>

        {/* Classe associée */}
        {mesPromos.length > 0 && (
          <div className="form-group">
            <label htmlFor="classe">
              Classe <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</small>
            </label>
            <select id="classe" name="classe" value={form.classe} onChange={update}>
              <option value="">— Choisir une classe —</option>
              {mesPromos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        {/* Paramètres quiz */}
        {form.type === "quiz" && (
          <div className="ai-form-grid">
            <div className="form-group">
              <label htmlFor="nombreQuestions">Nombre de questions</label>
              <input type="number" id="nombreQuestions" name="nombreQuestions"
                value={form.nombreQuestions} onChange={update} min={1} max={20} />
            </div>
            <div className="form-group">
              <label htmlFor="niveau">Niveau</label>
              <select id="niveau" name="niveau" value={form.niveau} onChange={update}>
                {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Paramètres examen */}
        {form.type === "examen" && (
          <div className="ai-form-grid">
            <div className="form-group">
              <label htmlFor="duree">Durée</label>
              <input id="duree" name="duree" value={form.duree} onChange={update} placeholder="Ex: 2 heures" />
            </div>
            <div className="form-group">
              <label htmlFor="bareme">Barème</label>
              <input id="bareme" name="bareme" value={form.bareme} onChange={update} placeholder="Ex: 20 points" />
            </div>
          </div>
        )}

        {/* Cours fourni */}
        <div className="form-group">
            <label htmlFor="courseFourni">
            Cours existant <small>(optionnel — si vide, l'IA génère depuis le thème)</small>
          </label>

          {/* Bouton upload PDF/Word */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button
              type="button"
              className="ai-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
            >
              {extracting ? "⏳ Extraction..." : "📎 Importer un PDF ou Word"}
            </button>
            {extractedFileName && (
              <span className="ai-upload-success">✓ {extractedFileName}</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <textarea id="courseFourni" name="courseFourni" value={form.courseFourni} onChange={update}
            rows={form.courseFourni ? 14 : 4}
            placeholder="Collez ici le contenu d'un cours existant, ou importez un PDF/Word ci-dessus..."
          />
        </div>

        {error && <p className="workspace-error" role="alert">{error}</p>}

        <button type="submit" className="workspace-button ai-generate-btn" disabled={loading || credits === 0}>
          {loading ? "Génération en cours..." : credits === 0 ? "Plus de crédits disponibles" : "Générer avec l'IA"}
        </button>
      </form>

      {/* ── Zone résultat ── */}
      {generated && (
        <div className="ai-result">
          <div className="ai-result-heading">
            <h3>Contenu généré — modifiez-le si besoin avant de télécharger ou sauvegarder</h3>
          </div>

          <textarea
            className="ai-result-editor"
            value={editedContent}
            onChange={(e) => setEdited(e.target.value)}
            rows={20}
          />

          {/* ── Panneau d'export ── */}
          <ExportPanel form={form} editedContent={editedContent} />

          {/* ── Sauvegarde backend ── */}
          <div className="ai-result-actions">
            <button className="workspace-button secondary" onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : "💾 Sauvegarder en brouillon"}
            </button>
            <button className="workspace-button" onClick={handleValidate} disabled={saving}>
              {saving ? "Enregistrement..." : (
                ["quiz", "serie", "examen"].includes(form.type)
                  ? "✓ Enregistrer dans Mes Quiz"
                  : "✓ Enregistrer dans Mes Contenus"
              )}
            </button>
          </div>

          {success && (
            <div className="workspace-notice" role="status">
              <p>{success}</p>
              {["quiz", "serie", "examen"].includes(form.type)
                ? <a href="/quiz" className="workspace-button secondary" style={{ display: "inline-block", marginTop: 8 }}>→ Aller à Mes Exercices</a>
                : <a href="/contents" className="workspace-button secondary" style={{ display: "inline-block", marginTop: 8 }}>→ Aller à Mes Cours</a>
              }
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AiGenerator() {
  const { user } = useAuth();
  const groups = user?.associations?.length ? user.associations : defaultGroups();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "chat" ? "chat" : "generate";
  const [tab, setTab] = useState(initialTab);

  return (
    <DashboardLayout activePage="ai" groups={groups}>
      <section className="ai-page-header">
        <div>
          <span className="dashboard-eyebrow">INTELLIGENCE ARTIFICIELLE</span>
          <h1>Assistant ExoCraft IA</h1>
          <p>Générez des cours, quiz, résumés, séries d'exercices et examens en quelques secondes.</p>
        </div>
      </section>

      <div className="ai-tabs">
        <button className={`ai-tab${tab === "generate" ? " active" : ""}`} onClick={() => setTab("generate")}>
          ✨ Générer un contenu
        </button>
        <button className={`ai-tab${tab === "chat" ? " active" : ""}`} onClick={() => setTab("chat")}>
          💬 Chat avec l'IA
        </button>
      </div>

      {tab === "generate" ? <AiGeneratorForm /> : <AiChat />}
    </DashboardLayout>
  );
}
