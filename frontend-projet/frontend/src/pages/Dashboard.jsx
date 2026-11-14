import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth, defaultGroups } from "../context/AuthContext";
import { contentApi, quizApi, paymentApi } from "../services/api";
import useMatieres from "../hooks/useMatieres";

/* ============================================================
   DASHBOARD UTILISATEUR  —  ExoCraft
   ============================================================ */

// ── Carte stat ────────────────────────────────────────────
function StatCard({ label, value, sub, gradient, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.65)",
        border: `1px solid ${hov ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.75)"}`,
        borderRadius: 20, padding: "24px 22px",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: hov
          ? "0 10px 36px rgba(37,99,235,0.14)"
          : "0 2px 16px rgba(37,99,235,0.07)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
        display: "flex", flexDirection: "column", gap: 8,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Pastille déco */}
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: gradient,
        marginBottom: 4,
        boxShadow: hov ? "0 6px 18px rgba(37,99,235,0.25)" : "none",
        transition: "box-shadow 0.3s",
      }} />
      <div style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 34, fontWeight: 900, lineHeight: 1,
        background: "linear-gradient(135deg, #2563EB, #06B6D4)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────
function QuickAction({ to, label, desc, gradient }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 18px",
          background: hov ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.55)",
          border: `1px solid ${hov ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.75)"}`,
          borderRadius: 16,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: hov ? "0 8px 28px rgba(37,99,235,0.14)" : "0 2px 10px rgba(37,99,235,0.05)",
          transform: hov ? "translateY(-3px)" : "translateY(0)",
          transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: gradient,
          boxShadow: hov ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
          transition: "box-shadow 0.25s",
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2,
          }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</div>
        </div>
        <span style={{
          fontSize: 16, color: hov ? "var(--color-primary)" : "var(--text-muted)",
          transition: "color 0.2s, transform 0.2s",
          transform: hov ? "translateX(3px)" : "translateX(0)",
        }}>→</span>
      </div>
    </Link>
  );
}

// ── Carte contenu récent ──────────────────────────────────
function ContentCard({ item, type, onView }) {
  const [hov, setHov] = useState(false);
  const isQuiz = type === "quiz";

  const typeLabel = item.type || (isQuiz ? "quiz" : "cours");
  const typeColors = {
    quiz:   { bg: "rgba(37,99,235,0.10)",  color: "#2563EB" },
    cours:  { bg: "rgba(6,182,212,0.10)",  color: "#06B6D4" },
    resume: { bg: "rgba(16,185,129,0.10)", color: "#059669" },
    serie:  { bg: "rgba(245,158,11,0.10)", color: "#D97706" },
    examen: { bg: "rgba(239,68,68,0.10)",  color: "#DC2626" },
  };
  const tc = typeColors[typeLabel] || typeColors.cours;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column",
        padding: 22,
        background: hov ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.68)",
        border: `1px solid ${hov ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.75)"}`,
        borderRadius: 20,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: hov ? "0 12px 36px rgba(37,99,235,0.14)" : "0 2px 14px rgba(37,99,235,0.06)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
      }}
    >
      {/* Top badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <span style={{
          padding: "3px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 700,
          background: tc.bg, color: tc.color,
        }}>{typeLabel}</span>
        {item.matiere && (
          <span style={{
            padding: "3px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            background: "rgba(37,99,235,0.07)", color: "var(--text-secondary)",
          }}>{item.matiere}</span>
        )}
        <span style={{
          marginLeft: "auto",
          padding: "3px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 600,
          background: item.statut === "valide" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
          color: item.statut === "valide" ? "#059669" : "#D97706",
        }}>{item.statut}</span>
      </div>

      {/* Titre */}
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        margin: "0 0 6px", fontSize: 15, fontWeight: 700,
        color: "var(--text-primary)", lineHeight: 1.3, overflowWrap: "anywhere",
      }}>{item.titre}</h3>

      {/* Thème */}
      {(item.theme || item.matiere) && (
        <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
          {item.theme || item.matiere}
        </p>
      )}

      {/* Date */}
      <small style={{ display: "block", color: "var(--text-muted)", fontSize: 11, marginBottom: 16 }}>
        {item.dateCreation || item.dateGeneration
          ? new Date(item.dateCreation || item.dateGeneration).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : ""}
      </small>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          onClick={() => onView(item)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#2563EB,#4F46E5)",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 3px 10px rgba(37,99,235,0.28)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(37,99,235,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 3px 10px rgba(37,99,235,0.28)"; }}
        >Aperçu</button>
        <Link to={isQuiz ? "/quiz" : "/contents"} style={{ flex: 1, textDecoration: "none" }}>
          <button style={{
            width: "100%", padding: "8px 0", borderRadius: 10,
            border: "1px solid rgba(37,99,235,0.2)",
            background: "rgba(37,99,235,0.07)",
            color: "var(--color-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,0.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(37,99,235,0.07)"; }}
          >Modifier</button>
        </Link>
      </div>
    </article>
  );
}

// ── Modal aperçu ──────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(11,27,77,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24, padding: 32,
          width: "90%", maxWidth: 700, maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(37,99,235,0.18)",
          border: "1px solid rgba(255,255,255,0.75)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16 }}>
          <h2 style={{
            margin: 0, color: "var(--text-primary)",
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
          }}>{item.titre}</h2>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
              background: "rgba(37,99,235,0.08)", color: "var(--text-primary)",
              fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center",
            }}
          >×</button>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
          {[item.type, item.matiere, item.theme].filter(Boolean).map((t, i) => (
            <span key={i} style={{
              padding: "3px 10px", borderRadius: 20,
              fontSize: 11, fontWeight: 600,
              background: "rgba(37,99,235,0.08)", color: "var(--color-primary)",
            }}>{t}</span>
          ))}
          <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: item.statut === "valide" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
            color: item.statut === "valide" ? "#059669" : "#D97706",
          }}>{item.statut}</span>
        </div>
        <div style={{
          whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 14,
          color: "var(--text-secondary)",
          background: "rgba(37,99,235,0.03)",
          border: "1px solid rgba(37,99,235,0.08)",
          borderRadius: 14, padding: 20,
        }}>
          {item.contenu || item.contenuIA || "Aucun contenu disponible."}
        </div>
      </div>
    </div>
  );
}

// ── Page Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const groups = useMemo(() =>
    user?.associations?.length ? user.associations : defaultGroups(), [user]);
  const { promos: mesPromos } = useMatieres();

  const [contents,  setContents]  = useState([]);
  const [quizzes,   setQuizzes]   = useState([]);
  const [credits,   setCredits]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const [search,       setSearch]       = useState("");
  const [classeFilter, setClasseFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [preview,      setPreview]      = useState(null);

  const classOptions = useMemo(() => mesPromos, [mesPromos]);

  const firstName = user?.prenom || user?.firstName || user?.email?.split("@")[0] || "Enseignant";

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true); setError("");
    try {
      const [contentsRes, quizzesRes, creditsRes] = await Promise.all([
        contentApi.getMesContenus({ page: 1, limit: 100 }),
        quizApi.getAll({ page: 1, limit: 100 }),
        paymentApi.myCredits().catch(() => ({ credits: null })),
      ]);
      setContents(contentsRes.data ?? []);
      setQuizzes(quizzesRes.data  ?? []);
      setCredits(creditsRes.credits ?? null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const allItems = useMemo(() => {
    const c = contents.map(i => ({ ...i, _kind: "cours" }));
    const q = quizzes.map(i  => ({ ...i, _kind: "quiz"  }));
    return [...c, ...q].sort((a, b) => {
      return new Date(b.dateCreation || b.dateGeneration || 0) -
             new Date(a.dateCreation || a.dateGeneration || 0);
    });
  }, [contents, quizzes]);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (typeFilter === "cours" && item._kind !== "cours") return false;
      if (typeFilter === "quiz"  && item._kind !== "quiz")  return false;
      if (classeFilter !== "all") {
        const theme = item.theme || "";
        if (!theme.toLowerCase().includes(classeFilter.toLowerCase())) return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = [item.titre, item.matiere, item.theme].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [allItems, typeFilter, classeFilter, search]);

  const stats = useMemo(() => ({
    total:   allItems.length,
    cours:   contents.length,
    quiz:    quizzes.length,
    valides: allItems.filter(i => i.statut === "valide").length,
  }), [allItems, contents, quizzes]);

  const recentItems = allItems.slice(0, 4);

  const quickActions = [
    { to: "/ai",       label: "Générer avec l'IA",   desc: "Créer un contenu en quelques secondes",   gradient: "linear-gradient(135deg,#2563EB,#4F46E5)" },
    { to: "/quiz",     label: "Mes exercices",        desc: "Quiz, séries, examens interactifs",        gradient: "linear-gradient(135deg,#06B6D4,#2563EB)" },
    { to: "/contents", label: "Mes cours",            desc: "Cours complets et résumés",               gradient: "linear-gradient(135deg,#4F46E5,#7C3AED)" },
    { to: "/archives", label: "Archives",             desc: "Contenus archivés et documents",          gradient: "linear-gradient(135deg,#059669,#06B6D4)" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <DashboardLayout activePage="dashboard" groups={groups}>

      {/* ── Hero banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 45%, #06B6D4 100%)",
        borderRadius: 24, padding: "36px 40px",
        marginBottom: 32, position: "relative", overflow: "hidden",
        boxShadow: "0 12px 40px rgba(37,99,235,0.28)",
      }}>
        {/* Cercles déco */}
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", border: "50px solid rgba(255,255,255,0.06)", right: -60, top: -120, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: "30px solid rgba(255,255,255,0.04)", left: -30, bottom: -60, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 10 }}>
              ESPACE ENSEIGNANT
            </div>
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              margin: "0 0 10px", color: "#fff",
              fontSize: "clamp(22px,3vw,32px)", fontWeight: 900,
              lineHeight: 1.1, letterSpacing: "-0.02em",
            }}>
              {greeting}, {firstName} !
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7, maxWidth: 500 }}>
              Vous avez <strong style={{ color: "#fff" }}>{stats.total} contenu{stats.total !== 1 ? "s" : ""}</strong> créé{stats.total !== 1 ? "s" : ""}.
              {credits !== null && ` Il vous reste `}
              {credits !== null && <strong style={{ color: credits === 0 ? "#FCA5A5" : "#A5F3FC" }}>{credits} crédit{credits !== 1 ? "s" : ""} IA</strong>}
              {credits !== null && "."}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <Link to="/ai" style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "10px 24px", borderRadius: 12, border: "none",
                  background: "#fff", color: "#2563EB",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800, fontSize: 13, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.15)"; }}
                >
                  Générer avec l'IA →
                </button>
              </Link>
              <Link to="/contents" style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "10px 20px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.14)",
                  color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                >
                  Mes cours
                </button>
              </Link>
            </div>
          </div>

          {/* Mini stats dans le hero */}
          <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
            {[
              { n: stats.cours,   l: "Cours" },
              { n: stats.quiz,    l: "Quiz"  },
              { n: stats.valides, l: "Validés" },
            ].map(({ n, l }) => (
              <div key={l} style={{
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 16, padding: "14px 20px", textAlign: "center",
                backdropFilter: "blur(8px)", minWidth: 72,
              }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="workspace-error" style={{ marginBottom: 24 }}>{error}</div>}

      {/* ── Stats cards ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 16, marginBottom: 36,
      }}>
        <StatCard label="Total contenus"   value={stats.total}   sub="Quiz + cours + résumés"  gradient="linear-gradient(135deg,#2563EB,#4F46E5)" delay={0}   />
        <StatCard label="Cours & résumés"  value={stats.cours}   sub="Contenus pédagogiques"   gradient="linear-gradient(135deg,#06B6D4,#2563EB)" delay={80}  />
        <StatCard label="Quiz & exercices" value={stats.quiz}    sub="Interactifs & partageables" gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" delay={160} />
        <StatCard label="Contenus validés" value={stats.valides} sub="Prêts pour vos étudiants" gradient="linear-gradient(135deg,#059669,#06B6D4)" delay={240} />
      </div>

      {/* ── Deux colonnes : accès rapide + récents ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 28, marginBottom: 40, alignItems: "start" }}>

        {/* Accès rapide */}
        <div>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em",
            color: "var(--text-primary)", margin: "0 0 14px",
          }}>Accès rapide</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quickActions.map(qa => <QuickAction key={qa.to} {...qa} />)}
          </div>

          {/* Crédits widget */}
          {credits !== null && (
            <div style={{
              marginTop: 20, padding: "18px 20px", borderRadius: 18,
              background: credits === 0
                ? "rgba(239,68,68,0.07)"
                : credits <= 5
                ? "rgba(245,158,11,0.07)"
                : "rgba(37,99,235,0.07)",
              border: `1px solid ${credits === 0 ? "rgba(239,68,68,0.2)" : credits <= 5 ? "rgba(245,158,11,0.2)" : "rgba(37,99,235,0.15)"}`,
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                }}>Crédits IA</span>
                <span style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 22, fontWeight: 900,
                  color: credits === 0 ? "#DC2626" : credits <= 5 ? "#D97706" : "var(--color-primary)",
                }}>{credits}</span>
              </div>
              {/* Barre */}
              <div style={{ height: 5, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${Math.min(100, (credits / 50) * 100)}%`,
                  background: credits === 0
                    ? "#EF4444"
                    : credits <= 5
                    ? "linear-gradient(90deg,#F59E0B,#EF4444)"
                    : "linear-gradient(90deg,#2563EB,#06B6D4)",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: credits <= 5 ? 10 : 0 }}>
                {credits === 0 ? "Plus de crédits disponibles." : `${credits} crédit${credits > 1 ? "s" : ""} disponible${credits > 1 ? "s" : ""}`}
              </div>
              {credits <= 5 && (
                <Link to="/pricing" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  background: credits === 0
                    ? "linear-gradient(135deg,#EF4444,#F87171)"
                    : "linear-gradient(135deg,#F59E0B,#FBBF24)",
                  color: "#fff", fontWeight: 700, fontSize: 11,
                  textDecoration: "none",
                  boxShadow: credits === 0 ? "0 3px 10px rgba(239,68,68,0.3)" : "0 3px 10px rgba(245,158,11,0.3)",
                }}>Recharger →</Link>
              )}
            </div>
          )}
        </div>

        {/* Contenus récents */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em",
              color: "var(--text-primary)", margin: 0,
            }}>Contenus récents</h2>
            {allItems.length > 4 && (
              <Link to="/contents" style={{
                fontSize: 12, fontWeight: 600, color: "var(--color-primary)",
                textDecoration: "none",
              }}>Voir tout →</Link>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
              Chargement…
            </div>
          ) : recentItems.length === 0 ? (
            <div className="workspace-empty">
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20, fontWeight: 800, color: "var(--color-primary)",
              }}>0</div>
              <h3>Aucun contenu pour l'instant</h3>
              <p>Générez votre premier contenu avec l'IA ou créez-en un manuellement.</p>
              <Link to="/ai"><button className="workspace-button" style={{ marginTop: 8 }}>Générer avec l'IA →</button></Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {recentItems.map(item => (
                <ContentCard
                  key={`${item._kind}-${item.id}`}
                  item={item} type={item._kind}
                  onView={setPreview}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tous les contenus (filtres + grille) ── */}
      <div style={{
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(255,255,255,0.75)",
        borderRadius: 24, padding: "28px",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 2px 16px rgba(37,99,235,0.07)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
            color: "var(--text-primary)", margin: 0,
          }}>
            Tous mes contenus
            <span style={{
              marginLeft: 10, padding: "3px 10px", borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              background: "rgba(37,99,235,0.08)", color: "var(--color-primary)",
            }}>{filtered.length}</span>
          </h2>
        </div>

        {/* Filtres */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Rechercher
            </label>
            <input
              type="search" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Titre, matière…"
              style={{
                width: "100%", padding: "10px 14px",
                border: "1.5px solid rgba(37,99,235,0.18)",
                borderRadius: 10, background: "rgba(255,255,255,0.80)",
                color: "var(--text-primary)", fontSize: 13, outline: "none",
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s, box-shadow 0.2s",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.14)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(37,99,235,0.18)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          {[
            { label: "Type", value: typeFilter, setter: setTypeFilter, options: [["all","Tous les types"],["cours","Cours / Résumés"],["quiz","Quiz / Exercices"]] },
            { label: "Classe", value: classeFilter, setter: setClasseFilter, options: [["all","Toutes les classes"], ...classOptions.map(c => [c,c])] },
          ].map(({ label, value, setter, options }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                {label}
              </label>
              <select
                value={value} onChange={e => setter(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid rgba(37,99,235,0.18)",
                  borderRadius: 10, background: "rgba(255,255,255,0.80)",
                  color: "var(--text-primary)", fontSize: 13, outline: "none",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backdropFilter: "blur(8px)",
                }}
              >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Réinitialiser */}
        {(search || typeFilter !== "all" || classeFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); setClasseFilter("all"); }}
            style={{
              marginBottom: 20, padding: "7px 16px", borderRadius: 8,
              border: "1px solid rgba(37,99,235,0.2)",
              background: "rgba(37,99,235,0.07)", color: "var(--color-primary)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >Réinitialiser les filtres</button>
        )}

        {/* Grille */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="workspace-empty" style={{ background: "transparent", border: "1.5px dashed rgba(37,99,235,0.2)" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px",
              background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--color-primary)",
            }}>0</div>
            <h3>{allItems.length === 0 ? "Votre premier contenu commence ici" : "Aucun résultat"}</h3>
            <p>{allItems.length === 0 ? "Générez votre premier contenu avec l'IA." : "Essayez d'autres critères de recherche."}</p>
            {allItems.length === 0 && (
              <Link to="/ai"><button className="workspace-button" style={{ marginTop: 8 }}>Générer avec l'IA →</button></Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(item => (
              <ContentCard
                key={`${item._kind}-${item.id}`}
                item={item} type={item._kind}
                onView={setPreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .dash-two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .dash-filters { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
