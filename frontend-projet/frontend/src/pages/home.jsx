import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import logo from "../assets/exocraft-logo.png";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/tokens.css";

/* ================================================================
   EXOCRAFT — PAGE D'ACCUEIL  (Modern SaaS / Glassmorphism)
   Stack : React + Vite + tokens.css
   Pas d'emojis décoratifs · Typographie Bricolage Grotesque
   ================================================================ */

// ── Hook IntersectionObserver (scroll reveal) ─────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sr");
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Hook compteur animé ───────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const ref = useRef(null);
  useEffect(() => {
    let st = null;
    const tick = (ts) => {
      if (!st) st = ts;
      const p = Math.min((ts - st) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.floor(ease * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

// ── Hook effet souris ─────────────────────────────────────────────
function useMouseGlow(containerRef) {
  const handleMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, [containerRef]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("pointermove", handleMove, { passive: true });
    return () => el.removeEventListener("pointermove", handleMove);
  }, [containerRef, handleMove]);
}

// ── Maquette hero (HTML/CSS pur, pas d'image) ─────────────────────
function HeroMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 460, margin: "0 auto" }}>
      {/* Carte principale */}
      <div style={{
        background: "var(--home-glass-bg)",
        border: "1px solid var(--home-glass-border)",
        borderRadius: "var(--r-lg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "24px",
        boxShadow: "var(--shadow-3)",
        position: "relative", zIndex: 1,
      }}>
        {/* Topbar simulée */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--home-glass-border)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#2563EB,#06B6D4)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, width: "55%", borderRadius: 4, background: "var(--home-text)", opacity: 0.15, marginBottom: 5 }} />
            <div style={{ height: 6, width: "35%", borderRadius: 3, background: "var(--home-text-2)", opacity: 0.12 }} />
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === 0 ? "#2563EB" : "var(--home-text-3)", opacity: i === 0 ? 0.9 : 0.25 }} />)}
          </div>
        </div>
        {/* Lignes de contenu */}
        {[90, 75, 85, 60, 80].map((w, i) => (
          <div key={i} style={{ height: 7, borderRadius: 4, background: "var(--home-text)", opacity: 0.07 + (i % 2) * 0.03, width: `${w}%`, marginBottom: 10 }} />
        ))}
        {/* Tags */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "Quiz", bg: "rgba(37,99,235,0.14)", color: "var(--home-blue)" },
            { label: "Cours", bg: "rgba(6,182,212,0.12)", color: "var(--home-cyan)" },
            { label: "IA active", bg: "linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.2))", color: "var(--home-indigo)" },
          ].map(t => (
            <span key={t.label} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color, border: "1px solid var(--home-glass-border)" }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Carte flottante haut-droite */}
      <div style={{
        position: "absolute", top: -22, right: -16, zIndex: 2,
        background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
        borderRadius: "var(--r-md)", padding: "12px 16px",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-2)",
        display: "flex", alignItems: "center", gap: 10, minWidth: 170,
        animation: "floatA 5s ease-in-out infinite",
      }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#06B6D4)", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--home-text)" }}>Quiz généré</div>
          <div style={{ fontSize: 10, color: "var(--home-text-2)" }}>10 questions · 8 s</div>
        </div>
      </div>

      {/* Carte flottante bas-gauche */}
      <div style={{
        position: "absolute", bottom: -18, left: -16, zIndex: 2,
        background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
        borderRadius: "var(--r-md)", padding: "12px 16px",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-2)",
        display: "flex", alignItems: "center", gap: 10, minWidth: 170,
        animation: "floatB 6s ease-in-out infinite",
      }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#2563EB)", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--home-text)" }}>Cours complet</div>
          <div style={{ fontSize: 10, color: "var(--home-text-2)" }}>Prêt à partager</div>
        </div>
      </div>
    </div>
  );
}

// ── Carte feature ──────────────────────────────────────────────────
function FeatureCard({ num, title, desc, stagger = 0 }) {
  const [hov, setHov] = useState(false);
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--cx", `${e.clientX - r.left}px`);
    el.style.setProperty("--cy", `${e.clientY - r.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseMove={onMove}
      className="sr"
      style={{
        transitionDelay: `${stagger * 80}ms`,
        background: hov ? "rgba(37,99,235,0.07)" : "var(--home-glass-bg)",
        border: `1px solid ${hov ? "rgba(37,99,235,0.3)" : "var(--home-glass-border)"}`,
        borderRadius: "var(--r-md)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        padding: "32px 28px",
        cursor: "default",
        transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hov ? "var(--shadow-3)" : "var(--shadow-1)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow au hover piloté par --cx/--cy */}
      {hov && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "var(--r-md)",
          background: "radial-gradient(300px circle at var(--cx,50%) var(--cy,50%), rgba(37,99,235,0.07), transparent 70%)",
        }} />
      )}
      {/* Numéro */}
      <div style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 13, fontWeight: 800, letterSpacing: "0.06em",
        color: "var(--home-blue)", opacity: 0.9, marginBottom: 16,
      }}>{num}</div>
      {/* Pastille décorative */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 20,
        background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(6,182,212,0.14))",
        border: "1px solid rgba(37,99,235,0.2)",
        transition: "all 0.3s",
        boxShadow: hov ? "0 4px 16px rgba(37,99,235,0.25)" : "none",
      }} />
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        margin: "0 0 10px", fontSize: 18, fontWeight: 700,
        letterSpacing: "-0.02em", color: "var(--home-text)",
      }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--home-text-2)" }}>{desc}</p>
    </div>
  );
}

// ── Accordéon FAQ ──────────────────────────────────────────────────
function FaqItem({ q, a, stagger = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sr" style={{ transitionDelay: `${stagger * 60}ms`, borderBottom: "1px solid var(--home-glass-border)" }}>
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "20px 0", border: "none", background: "none",
          cursor: "pointer", textAlign: "left",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 16, fontWeight: 600, color: "var(--home-text)",
          transition: "color 0.2s",
        }}
      >
        {q}
        <span style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          background: open ? "var(--home-blue)" : "var(--home-glass-bg)",
          border: "1px solid var(--home-glass-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: open ? "#fff" : "var(--home-text-2)",
          transition: "all 0.3s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>+</span>
      </button>
      <div style={{
        overflow: "hidden", maxHeight: open ? 300 : 0,
        transition: "max-height 0.4s cubic-bezier(.22,1,.36,1)",
      }}>
        <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.75, color: "var(--home-text-2)" }}>{a}</p>
      </div>
    </div>
  );
}

// ── Bouton primaire avec effet enfoncement ─────────────────────────
function BtnPrimary({ children, onClick, size = "md" }) {
  const [pressed, setPressed] = useState(false);
  const pad = size === "lg" ? "16px 40px" : "11px 26px";
  const fz  = size === "lg" ? 16 : 14;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: pad, borderRadius: "var(--r-sm)", border: "none",
        background: "var(--home-btn-bg)", color: "#fff",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: fz, fontWeight: 700, cursor: "pointer",
        boxShadow: pressed ? "0 2px 8px rgba(37,99,235,0.3)" : "var(--home-btn-shadow)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.18s cubic-bezier(.22,1,.36,1)",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={e => { if (!pressed) e.currentTarget.style.boxShadow = "var(--home-btn-shadow-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--home-btn-shadow)"; }}
    >
      {children}
    </button>
  );
}

function BtnGlass({ children, onClick, size = "md" }) {
  const [pressed, setPressed] = useState(false);
  const pad = size === "lg" ? "16px 40px" : "11px 26px";
  const fz  = size === "lg" ? 16 : 14;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: pad, borderRadius: "var(--r-sm)",
        border: "1px solid var(--home-glass-border)",
        background: "var(--home-glass-bg)", color: "var(--home-text)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: fz, fontWeight: 600, cursor: "pointer",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-1)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.18s cubic-bezier(.22,1,.36,1)",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"; e.currentTarget.style.background = "rgba(37,99,235,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--home-glass-border)"; e.currentTarget.style.background = "var(--home-glass-bg)"; }}
    >
      {children}
    </button>
  );
}

// ── Section Démo ───────────────────────────────────────────────────
function DemoSection({ onTryDemo }) {
  const [demoType, setDemoType] = useState("quiz");
  const [demoTheme, setDemoTheme] = useState("");
  const [demoResult, setDemoResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const DEMO_TYPES = [
    { value: "quiz",   label: "Quiz" },
    { value: "cours",  label: "Cours" },
    { value: "resume", label: "Résumé" },
    { value: "examen", label: "Examen" },
  ];

  const handleDemo = async () => {
    if (!demoTheme.trim()) return;
    setLoading(true);
    setDemoResult(null);
    // Simule un appel IA (3 s) pour la démo publique
    await new Promise(r => setTimeout(r, 2800));
    setDemoResult(
      `Voici un aperçu de ${demoType} sur "${demoTheme}".\n\n` +
      `Introduction : Ce ${demoType} couvre les aspects essentiels de "${demoTheme}".\n\n` +
      `Pour accéder au contenu complet, généré en temps réel par l'IA, créez un compte gratuit.`
    );
    setLoading(false);
  };

  return (
    <section id="demo" style={{
      padding: "100px clamp(20px,8vw,100px)",
      position: "relative", zIndex: 1,
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="sr" style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="home-label">DÉMO SANS INSCRIPTION</span>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800,
            letterSpacing: "-0.02em", margin: "0 0 16px", color: "var(--home-text)",
            lineHeight: 1.1,
          }}>
            Essayez <span className="home-grad">maintenant</span>
          </h2>
          <p style={{ fontSize: 17, color: "var(--home-text-2)", lineHeight: 1.7, margin: "0 auto", maxWidth: 520 }}>
            Générez un aperçu de contenu pédagogique sans créer de compte. Le résultat complet est disponible après inscription.
          </p>
        </div>

        <div className="sr" style={{
          background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
          borderRadius: "var(--r-lg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          padding: "36px", boxShadow: "var(--shadow-2)",
        }}>
          {/* Sélecteur type */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {DEMO_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setDemoType(t.value)}
                style={{
                  padding: "9px 20px", borderRadius: "var(--r-sm)", border: "none",
                  background: demoType === t.value ? "var(--home-btn-bg)" : "var(--home-glass-bg)",
                  color: demoType === t.value ? "#fff" : "var(--home-text-2)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${demoType === t.value ? "transparent" : "var(--home-glass-border)"}`,
                  boxShadow: demoType === t.value ? "var(--home-btn-shadow)" : "none",
                  transition: "all 0.2s",
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Champ thème */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={demoTheme}
              onChange={e => setDemoTheme(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDemo()}
              placeholder={`Thème du ${demoType}, ex: Les algorithmes de tri…`}
              style={{
                flex: 1, minWidth: 220,
                padding: "12px 16px", borderRadius: "var(--r-sm)",
                border: "1.5px solid var(--home-glass-border)",
                background: "rgba(255,255,255,0.4)", color: "var(--home-text)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                backdropFilter: "blur(8px)",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(37,99,235,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--home-glass-border)"; e.target.style.boxShadow = "none"; }}
            />
            <BtnPrimary onClick={handleDemo} size="md">
              {loading ? "Génération…" : "Générer l'aperçu →"}
            </BtnPrimary>
          </div>

          {/* Résultat */}
          {(loading || demoResult) && (
            <div style={{
              marginTop: 24, padding: "20px", borderRadius: "var(--r-md)",
              background: loading ? "rgba(37,99,235,0.04)" : "rgba(37,99,235,0.05)",
              border: "1px solid rgba(37,99,235,0.15)",
              minHeight: loading ? 80 : "auto",
              display: "flex", alignItems: loading ? "center" : "flex-start",
              justifyContent: loading ? "center" : "flex-start",
            }}>
              {loading ? (
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--home-blue)", animation: `demoTyping 1.2s ${i*0.2}s ease-in-out infinite` }} />
                  ))}
                  <span style={{ marginLeft: 10, fontSize: 13, color: "var(--home-text-2)" }}>L'IA génère…</span>
                </div>
              ) : (
                <div style={{ width: "100%" }}>
                  <pre style={{ margin: "0 0 20px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, lineHeight: 1.75, color: "var(--home-text-2)", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {demoResult}
                  </pre>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid rgba(37,99,235,0.12)" }}>
                    <BtnPrimary onClick={onTryDemo} size="md">Créer un compte pour le contenu complet →</BtnPrimary>
                    <BtnGlass onClick={onTryDemo} size="md">Se connecter</BtnGlass>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Composant navbar ───────────────────────────────────────────────
function Navbar({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const NAV_LINKS = [
    { label: "Fonctionnalités", id: "features" },
    { label: "Démo", id: "demo" },
    { label: "Comment ça marche", id: "how" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <>
      <header style={{
        position: "sticky", top: scrolled ? 8 : 0, zIndex: 100,
        display: "flex", justifyContent: "center",
        padding: `${scrolled ? 8 : 0}px clamp(16px,4vw,40px)`,
        transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
      }}>
        <nav style={{
          width: "100%", maxWidth: 1100,
          display: "flex", alignItems: "center", gap: 8,
          height: scrolled ? 60 : 72,
          padding: "0 20px",
          background: "var(--home-nav-bg)",
          border: "1px solid var(--home-nav-border)",
          borderRadius: scrolled ? "var(--r-lg)" : 0,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: scrolled ? "var(--shadow-2)" : "none",
          transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
        }}>
          {/* Logo */}
          <img src={logo} alt="ExoCraft" style={{ height: 32, width: "auto", flexShrink: 0 }} />

          {/* Liens centre — desktop */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 4 }} className="nav-links-desktop">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, fontWeight: 500, color: "var(--home-text-2)",
                padding: "8px 14px", borderRadius: 8,
                transition: "color 0.2s, background 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--home-blue)"; e.currentTarget.style.background = "rgba(37,99,235,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--home-text-2)"; e.currentTarget.style.background = "none"; }}
              >{l.label}</button>
            ))}
          </div>

          {/* Actions droite */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} className="nav-actions-desktop">
            <ThemeToggle />
            <BtnGlass onClick={onLogin} size="md">Connexion</BtnGlass>
            <BtnPrimary onClick={onRegister} size="md">Créer un compte →</BtnPrimary>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="nav-burger"
            style={{
              display: "none", marginLeft: "auto",
              width: 44, height: 44, border: "1px solid var(--home-glass-border)",
              borderRadius: "var(--r-sm)", background: "var(--home-glass-bg)",
              cursor: "pointer", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            {[0,1,2].map(i => (
              <span key={i} style={{
                display: "block", width: 18, height: 2, borderRadius: 1,
                background: "var(--home-text)",
                transition: "all 0.3s",
                transform: menuOpen && i === 0 ? "rotate(45deg) translate(5px,5px)" : menuOpen && i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </nav>
      </header>

      {/* Menu mobile plein écran */}
      {menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "var(--home-nav-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, animation: "menuIn 0.3s cubic-bezier(.22,1,.36,1)",
        }}>
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 24, fontWeight: 700, color: "var(--home-text)",
              padding: "14px 32px", borderRadius: "var(--r-sm)",
              minWidth: 240, minHeight: 44,
            }}>{l.label}</button>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <BtnGlass onClick={() => { onLogin(); setMenuOpen(false); }} size="lg">Connexion</BtnGlass>
            <BtnPrimary onClick={() => { onRegister(); setMenuOpen(false); }} size="lg">Créer un compte →</BtnPrimary>
          </div>
          <div style={{ marginTop: 16 }}><ThemeToggle /></div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .nav-links-desktop { display: none !important; }
          .nav-actions-desktop { display: none !important; }
          .nav-burger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ── Page principale ────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  useScrollReveal();
  useMouseGlow(pageRef);

  // Suivi curseur global (halo)
  const haloRef = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    if (!mq.matches) return; // pas de suivi sur mobile tactile
    const move = (e) => {
      if (haloRef.current) {
        haloRef.current.style.left = `${e.clientX}px`;
        haloRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const features = [
    { num: "01", title: "Cours complets",      desc: "Structurez vos cours avec introduction, développement et conclusion clairs et pédagogiques." },
    { num: "02", title: "Résumés clairs",      desc: "Condensez vos leçons en points clés accessibles rapidement par les étudiants." },
    { num: "03", title: "Séries d'exercices",  desc: "Générez des exercices progressifs avec corrigés détaillés adaptés au niveau universitaire." },
    { num: "04", title: "Quiz interactifs",    desc: "Quiz QCM partageables par lien avec correction automatique et résultats instantanés." },
    { num: "05", title: "Examens formels",     desc: "Créez des examens avec barème, durée définis, et version corrigée pour le professeur." },
    { num: "06", title: "Assistant IA",        desc: "Générez n'importe quel type de contenu pédagogique en quelques secondes grâce à l'IA." },
  ];

  const steps = [
    { n: "01", title: "Choisissez le type",   desc: "Quiz, cours, résumé, série d'exercices ou examen — vous décidez du format." },
    { n: "02", title: "L'IA génère",          desc: "Contenu structuré, pédagogique et adapté au niveau universitaire en quelques secondes." },
    { n: "03", title: "Modifiez",             desc: "Éditez, reformulez ou enrichissez le contenu selon vos besoins spécifiques." },
    { n: "04", title: "Partagez",             desc: "Envoyez par lien direct ou exportez en PDF / Word en un clic." },
  ];

  const faqs = [
    { q: "Est-ce gratuit ?",
      a: "Un quota de générations est offert gratuitement à l'inscription. Des crédits supplémentaires sont disponibles à l'achat. Aucune carte bancaire requise pour démarrer." },
    { q: "Quels formats d'export sont disponibles ?",
      a: "Vous pouvez exporter tout contenu généré en PDF ou en Word (.docx), avec ou sans corrigé selon le type de document." },
    { q: "Puis-je modifier le contenu généré ?",
      a: "Oui. Chaque contenu est entièrement éditable avant et après sauvegarde. Vous restez toujours maître du résultat final." },
    { q: "Mes données sont-elles privées ?",
      a: "Vos contenus sont associés à votre compte et ne sont pas partagés avec d'autres utilisateurs. Consultez notre politique de confidentialité pour les détails." },
    { q: "Comment partager un quiz avec mes étudiants ?",
      a: "Chaque quiz génère un lien unique. Vos étudiants accèdent au quiz et soumettent leurs réponses sans créer de compte ExoCraft." },
  ];

  return (
    <div ref={pageRef} className="home-wrap home-noise" style={{
      background: `linear-gradient(160deg, var(--home-bg-start) 0%, var(--home-bg-mid1) 30%, var(--home-bg-mid2) 65%, var(--home-bg-end) 100%)`,
      minHeight: "100vh", overflowX: "hidden",
    }}>

      {/* Halo souris (desktop uniquement) */}
      <div ref={haloRef} style={{
        position: "fixed", width: 300, height: 300,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        transform: "translate(-50%,-50%)",
        background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)",
        filter: "blur(2px)",
        transition: "left 0.12s, top 0.12s",
      }} />

      {/* Blobs décoratifs */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700, borderRadius: "50%", background: `radial-gradient(circle, var(--home-blob1) 0%, transparent 70%)`, top: "-15%", left: "-10%", animation: "blob1 25s ease-in-out infinite", filter: "blur(2px)" }} />
        <div style={{ position: "absolute", width: "45vw", height: "45vw", maxWidth: 580, maxHeight: 580, borderRadius: "50%", background: `radial-gradient(circle, var(--home-blob2) 0%, transparent 70%)`, top: "20%", right: "-8%", animation: "blob2 30s ease-in-out infinite", filter: "blur(2px)" }} />
        <div style={{ position: "absolute", width: "40vw", height: "40vw", maxWidth: 500, maxHeight: 500, borderRadius: "50%", background: `radial-gradient(circle, var(--home-blob3) 0%, transparent 70%)`, bottom: "5%", left: "15%", animation: "blob3 22s ease-in-out infinite", filter: "blur(2px)" }} />
        <div style={{ position: "absolute", width: "30vw", height: "30vw", maxWidth: 400, maxHeight: 400, borderRadius: "50%", background: `radial-gradient(circle, var(--home-blob4) 0%, transparent 70%)`, bottom: "25%", right: "5%", animation: "blob4 28s ease-in-out infinite", filter: "blur(2px)" }} />
      </div>

      {/* ── NAVBAR ── */}
      <Navbar onLogin={() => navigate("/login")} onRegister={() => navigate("/register")} />

      {/* ── HERO ── */}
      <section id="hero" style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 60, flexWrap: "wrap",
        padding: "80px clamp(20px,8vw,100px) 60px",
        maxWidth: 1280, margin: "0 auto",
      }}>
        {/* Gauche */}
        <div style={{ flex: "1 1 420px", maxWidth: 580 }}>
          {/* Badge */}
          <div className="sr" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 20, padding: "6px 16px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--home-blue)", marginBottom: 28, textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--home-blue)", display: "inline-block" }} />
            Plateforme pédagogique IA
          </div>

          {/* Titre */}
          <h1 className="sr" style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-0.02em",
            margin: "0 0 24px",
            color: "var(--home-text)",
            transitionDelay: "80ms",
          }}>
            Créez vos contenus<br />
            <span className="home-grad">pédagogiques</span><br />
            avec l'IA
          </h1>

          <p className="sr" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18, lineHeight: 1.7,
            color: "var(--home-text-2)", margin: "0 0 40px", maxWidth: 500,
            transitionDelay: "160ms",
          }}>
            Quiz, cours, examens, résumés — conçu pour les enseignants universitaires qui veulent gagner du temps sans perdre en qualité.
          </p>

          {/* CTAs */}
          <div className="sr" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 52, transitionDelay: "240ms" }}>
            <BtnPrimary onClick={() => navigate("/register")} size="lg">Créer un compte gratuit →</BtnPrimary>
            <BtnGlass onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} size="lg">Essayer la démo</BtnGlass>
          </div>

          {/* Stats */}
          <div className="sr" style={{
            display: "flex", gap: 0,
            background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
            borderRadius: "var(--r-md)", overflow: "hidden", width: "fit-content",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            transitionDelay: "320ms",
          }}>
            {[
              { val: 5, suffix: "", label: "Types de contenu" },
              { val: 100, suffix: "+", label: "Enseignants actifs" },
              { val: 10, suffix: "s", label: "Génération moyenne" },
            ].map(({ val, suffix, label }, i) => (
              <div key={label} style={{
                padding: "16px 28px",
                borderRight: i < 2 ? "1px solid var(--home-glass-border)" : "none",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 28, fontWeight: 800,
                  background: "var(--home-grad-text)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  <AnimatedCounter target={val} suffix={suffix} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--home-text-3)", fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Maquette droite */}
        <div className="sr" style={{ flex: "1 1 360px", maxWidth: 460, padding: "30px 20px", transitionDelay: "200ms", animation: "floatHero 8s ease-in-out infinite" }}>
          <HeroMockup />
        </div>
      </section>

      {/* ── DÉMO ── */}
      <DemoSection onTryDemo={() => navigate("/register")} />

      {/* ── FONCTIONNALITÉS ── */}
      <section id="features" style={{
        position: "relative", zIndex: 1,
        padding: "100px clamp(20px,8vw,100px)",
        borderTop: "1px solid rgba(37,99,235,0.08)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="sr" style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="home-label">VOS CONTENUS</span>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800,
              letterSpacing: "-0.02em", margin: "0 0 16px",
              color: "var(--home-text)", lineHeight: 1.1,
            }}>
              Tout ce dont vous avez besoin,<br /><span className="home-grad">en un seul endroit</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--home-text-2)", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
              Un seul espace pour créer, organiser et partager tous vos supports pédagogiques universitaires.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {features.map((f, i) => <FeatureCard key={f.num} {...f} stagger={i} />)}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="how" style={{
        position: "relative", zIndex: 1,
        padding: "100px clamp(20px,8vw,100px)",
        borderTop: "1px solid rgba(37,99,235,0.08)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sr" style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="home-label">COMMENT ÇA MARCHE</span>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800,
              letterSpacing: "-0.02em", margin: 0,
              color: "var(--home-text)", lineHeight: 1.1,
            }}>
              De l'idée au contenu en <span className="home-grad">4 étapes</span>
            </h2>
          </div>
          {/* Steps avec ligne de connexion */}
          <div style={{ position: "relative" }}>
            {/* Ligne fine horizontale */}
            <div className="sr" style={{
              position: "absolute", top: 32, left: "10%", right: "10%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.25), rgba(6,182,212,0.25), transparent)",
              zIndex: 0,
            }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24, position: "relative", zIndex: 1 }}>
              {steps.map((s, i) => (
                <div key={s.n} className="sr" style={{ transitionDelay: `${i * 100}ms` }}>
                  {/* Card step */}
                  <div style={{
                    background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
                    borderRadius: "var(--r-md)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    padding: "32px 24px", textAlign: "center",
                    boxShadow: "var(--shadow-1)", position: "relative",
                  }}>
                    {/* Pastille numéro */}
                    <div style={{
                      position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                      width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg,#2563EB,#06B6D4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 13, fontWeight: 800, color: "#fff",
                      boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                    }}>{s.n}</div>
                    <div style={{ marginTop: 16 }}>
                      <h3 style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        margin: "0 0 10px", fontSize: 18, fontWeight: 700,
                        letterSpacing: "-0.02em", color: "var(--home-text)",
                      }}>{s.title}</h3>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--home-text-2)" }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{
        position: "relative", zIndex: 1,
        padding: "100px clamp(20px,8vw,100px)",
        borderTop: "1px solid rgba(37,99,235,0.08)",
      }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div className="sr" style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="home-label">FAQ</span>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800,
              letterSpacing: "-0.02em", margin: 0,
              color: "var(--home-text)", lineHeight: 1.1,
            }}>
              Questions <span className="home-grad">fréquentes</span>
            </h2>
          </div>
          <div style={{
            background: "var(--home-glass-bg)", border: "1px solid var(--home-glass-border)",
            borderRadius: "var(--r-lg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            padding: "0 32px", boxShadow: "var(--shadow-2)",
          }}>
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} stagger={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" style={{
        position: "relative", zIndex: 1,
        padding: "100px clamp(20px,8vw,100px)",
      }}>
        <div className="sr" style={{
          maxWidth: 820, margin: "0 auto",
          borderRadius: "var(--r-lg)", padding: "72px 48px",
          textAlign: "center", overflow: "hidden", position: "relative",
          background: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(79,70,229,0.14) 50%, rgba(6,182,212,0.12) 100%)",
          border: "1px solid rgba(37,99,235,0.25)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 80px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}>
          {/* Blobs */}
          <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.2) 0%,transparent 70%)", top: "-120px", right: "-80px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.15) 0%,transparent 70%)", bottom: "-60px", left: "-60px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(1.8rem,4vw,3.2rem)", fontWeight: 800,
              letterSpacing: "-0.02em", margin: "0 0 16px",
              color: "var(--home-text)", lineHeight: 1.1,
            }}>
              Prêt à créer vos contenus ?
            </h2>
            <p style={{ fontSize: 17, color: "var(--home-text-2)", margin: "0 auto 36px", maxWidth: 500, lineHeight: 1.7 }}>
              Rejoignez les enseignants universitaires qui utilisent ExoCraft pour simplifier leur travail au quotidien.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <BtnPrimary onClick={() => navigate("/register")} size="lg">Créer un compte gratuit →</BtnPrimary>
              <BtnGlass onClick={() => navigate("/login")} size="lg">Se connecter</BtnGlass>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(37,99,235,0.1)",
        padding: "32px clamp(20px,6vw,80px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        background: "rgba(255,255,255,0.03)",
      }}>
        <img src={logo} alt="ExoCraft" style={{ height: 28, width: "auto", opacity: 0.85 }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "Connexion",        action: () => navigate("/login") },
            { label: "Créer un compte",  action: () => navigate("/register") },
            { label: "Confidentialité",  action: () => {} },
            { label: "Contact",          action: () => {} },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, color: "var(--home-text-3)", transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--home-blue)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--home-text-3)"}
            >{label}</button>
          ))}
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--home-text-3)" }}>
          © {new Date().getFullYear()} ExoCraft · Plateforme pédagogique IA
        </span>
      </footer>

      {/* ── Keyframes globaux ── */}
      <style>{`
        @keyframes floatHero { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-8px) rotate(-1deg)} }
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,2%) scale(1.04)} 66%{transform:translate(-2%,3%) scale(0.97)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-3%,-2%) scale(1.05)} 66%{transform:translate(2%,-3%) scale(0.96)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(2%,-2%) scale(1.03)} }
        @keyframes blob4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-2%,2%) scale(1.04)} }
        @keyframes menuIn { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        @keyframes demoTyping { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }
        @media (prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation:none!important; transition:none!important; }
        }
        @media (max-width:600px) {
          .home-wrap section { padding-top:60px; padding-bottom:60px; }
        }
      `}</style>
    </div>
  );
}
