import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth, defaultGroups } from "../context/AuthContext";
import { contentApi, quizApi } from "../services/api";
import useMatieres from "../hooks/useMatieres";

// ── Carte contenu ────────────────────────────────────────────────────────────
function ContentCard({ item, type, onView }) {
  const isQuiz = type === "quiz";
  const badge = isQuiz
    ? { cours: "📘", quiz: "☑", serie: "✎", examen: "📋" }[item.type] || "☑"
    : { cours: "📘", resume: "📄" }[item.type] || "📄";

  return (
    <article className="workspace-card">
      <div className="workspace-card-top">
        <span className="workspace-badge">{badge} {item.type}</span>
        <span className="workspace-badge">{item.matiere}</span>
        <span className={`workspace-badge${item.statut === "valide" ? " valid" : ""}`}>
          {item.statut}
        </span>
      </div>
      <h3>{item.titre}</h3>
      <p>{item.theme || item.matiere}</p>
      <small>
        {item.dateCreation || item.dateGeneration
          ? new Date(item.dateCreation || item.dateGeneration).toLocaleDateString("fr-FR")
          : ""}
      </small>
      <div className="workspace-card-actions">
        <button onClick={() => onView(item)}>Voir</button>
        <Link to={isQuiz ? "/quiz" : "/contents"}>
          <button>Modifier</button>
        </Link>
      </div>
    </article>
  );
}

// ── Modal aperçu ─────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(30,20,60,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(3px)",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 32,
        width: "90%", maxWidth: 700, maxHeight: "80vh",
        overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: "#30247d" }}>{item.titre}</h2>
          <button className="workspace-button secondary" onClick={onClose}>✕ Fermer</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span className="workspace-badge">{item.type}</span>
          <span className="workspace-badge">{item.matiere}</span>
          {item.theme && <span className="workspace-badge">{item.theme}</span>}
          <span className={`workspace-badge${item.statut === "valide" ? " valid" : ""}`}>{item.statut}</span>
        </div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 14, color: "#292642" }}>
          {item.contenu || item.contenuIA || "Aucun contenu disponible."}
        </div>
      </div>
    </div>
  );
}

// ── Page Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const groups = useMemo(() =>
    user?.associations?.length ? user.associations : defaultGroups(), [user]);
  const { promos: mesPromos } = useMatieres();

  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtres
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all | cours | quiz

  // Aperçu
  const [preview, setPreview] = useState(null);

  // Classes depuis l'admin en priorité
  const classOptions = useMemo(() => mesPromos, [mesPromos]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [contentsRes, quizzesRes] = await Promise.all([
        contentApi.getMesContenus({ page: 1, limit: 50 }),
        quizApi.getAll({ page: 1, limit: 50 }),
      ]);
      setContents(contentsRes.data ?? []);
      setQuizzes(quizzesRes.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fusion cours + quiz pour l'affichage
  const allItems = useMemo(() => {
    const c = contents.map(item => ({ ...item, _kind: "cours" }));
    const q = quizzes.map(item => ({ ...item, _kind: "quiz" }));
    return [...c, ...q].sort((a, b) => {
      const da = new Date(a.dateCreation || a.dateGeneration || 0);
      const db = new Date(b.dateCreation || b.dateGeneration || 0);
      return db - da;
    });
  }, [contents, quizzes]);

  // Application des filtres
  const filtered = useMemo(() => {
    return allItems.filter(item => {
      // Filtre type
      if (typeFilter === "cours" && item._kind !== "cours") return false;
      if (typeFilter === "quiz" && item._kind !== "quiz") return false;

      // Filtre classe (stockée dans theme)
      if (classeFilter !== "all") {
        const theme = item.theme || "";
        if (!theme.toLowerCase().includes(classeFilter.toLowerCase())) return false;
      }

      // Filtre recherche
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        const matchable = [item.titre, item.matiere, item.theme].filter(Boolean).join(" ").toLowerCase();
        if (!matchable.includes(searchLower)) return false;
      }

      return true;
    });
  }, [allItems, typeFilter, classeFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: allItems.length,
    cours: contents.length,
    quiz: quizzes.length,
    valides: allItems.filter(i => i.statut === "valide").length,
  }), [allItems, contents, quizzes]);

  return (
    <DashboardLayout activePage="dashboard" groups={groups}>

      {/* En-tête */}
      <section className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">ESPACE ENSEIGNANT</span>
          <h1>Tableau de bord</h1>
          <p>Consultez et gérez tous vos contenus pédagogiques au même endroit.</p>
        </div>
      </section>

      {/* Stats */}
      <div className="workspace-stats" aria-label="Résumé des contenus">
        <div><span>Total contenus</span><strong>{stats.total}</strong></div>
        <div><span>Cours / Résumés</span><strong>{stats.cours}</strong></div>
        <div><span>Quiz / Exercices</span><strong>{stats.quiz}</strong></div>
        <div><span>Validés</span><strong>{stats.valides}</strong></div>
      </div>

      {error && <p className="workspace-error">{error}</p>}

      {/* Filtres */}
      <section className="workspace-library">
        <div className="workspace-section-heading">
          <h2>Mes contenus</h2>
          <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="workspace-filters">
          <label>
            Rechercher
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Titre, matière..."
            />
          </label>

          <label>
            Type
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">Tous les types</option>
              <option value="cours">Cours / Résumés</option>
              <option value="quiz">Quiz / Exercices</option>
            </select>
          </label>

          <label>
            Classe
            <select value={classeFilter} onChange={e => setClasseFilter(e.target.value)}>
              <option value="all">Toutes les classes</option>
              {classOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#69647b", padding: 40 }}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="workspace-empty">
            <span aria-hidden="true">▤</span>
            <h3>{allItems.length === 0 ? "Votre premier contenu commence ici" : "Aucun résultat"}</h3>
            <p>
              {allItems.length === 0
                ? "Générez votre premier contenu avec l'IA ou créez-en un manuellement."
                : "Essayez un autre titre ou réinitialisez les filtres."}
            </p>
            {allItems.length > 0 && (
              <button className="workspace-button secondary" onClick={() => {
                setSearch(""); setTypeFilter("all"); setClasseFilter("all");
              }}>
                Réinitialiser les filtres
              </button>
            )}
            {allItems.length === 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/ai"><button className="workspace-button">✨ Générer avec l'IA</button></Link>
                <Link to="/contents"><button className="workspace-button secondary">+ Créer un cours</button></Link>
                <Link to="/quiz"><button className="workspace-button secondary">+ Créer un quiz</button></Link>
              </div>
            )}
          </div>
        ) : (
          <div className="workspace-cards">
            {filtered.map(item => (
              <ContentCard
                key={`${item._kind}-${item.id}`}
                item={item}
                type={item._kind}
                onView={setPreview}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal aperçu */}
      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}

    </DashboardLayout>
  );
}
