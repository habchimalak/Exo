import { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useMatieres from "../hooks/useMatieres";
import logo from "../assets/exocraft-logo.png";
import { paymentApi } from "../services/api";
import ThemeToggle from "./ThemeToggle";

function DashboardLayout({ children, activePage, selectedGroup = null, onSelectGroup }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { promos: mesClasses } = useMatieres();
  const [credits, setCredits] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    paymentApi.myCredits()
      .then((d) => setCredits(d.credits))
      .catch(() => {});
  }, []);

  const groups = mesClasses.map(p => ({ className: p, section: '' }));

  const baseItems = [
    { path: '/dashboard', page: 'dashboard', label: 'Tableau de bord' },
    { path: '/ai',        page: 'ai',        label: 'Assistant IA'    },
    { path: '/quiz',      page: 'quiz',      label: 'Mes Exercices'   },
    { path: '/contents',  page: 'contents',  label: 'Mes Cours'       },
    { path: '/archives',  page: 'archives',  label: 'Archives'        },
    { path: '/pricing',   page: 'pricing',   label: 'Crédits IA'      },
  ];
  const adminItem = { path: '/admin', page: 'admin', label: 'Administration' };
  const menuItems = user?.role === 'administrateur' ? [...baseItems, adminItem] : baseItems;

  const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus(); };
  const signOut = () => { logout(); navigate("/login", { replace: true }); };

  /* ── Mobile nav (slide-in) ── */
  const mobileNav = (
    <>
      <p className="sidebar-title">MENU PRINCIPAL</p>
      <nav className="sidebar-menu" aria-label="Navigation principale">
        {menuItems.map(({ path, page, label }) => (
          <NavLink key={path} to={path}
            className={({ isActive }) => `sidebar-item${isActive || activePage === page ? " active" : ""}`}
            onClick={closeMenu}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {groups.length > 0 && (
        <div className="sidebar-groups" aria-label="Classes et sections">
          <p className="sidebar-title">MES CLASSES</p>
          <button type="button"
            className={`sidebar-group-button${selectedGroup === "all" ? " active" : ""}`}
            onClick={() => { onSelectGroup?.("all"); closeMenu(); }}
          >Toutes les classes</button>
          {groups.map((g) => (
            <button key={g.className} type="button"
              className={`sidebar-group-button${selectedGroup?.className === g.className ? " active" : ""}`}
              onClick={() => { onSelectGroup?.(g); closeMenu(); }}
            >{g.className}</button>
          ))}
        </div>
      )}
      <button type="button" className="sidebar-item sidebar-logout" onClick={signOut}>
        Se déconnecter
      </button>
    </>
  );

  return (
    <div className="dashboard-page"
      onKeyDown={(e) => { if (menuOpen && e.key === "Escape") closeMenu(); }}
    >
      <a className="skip-link" href="#main-content">Aller au contenu</a>

      {/* ── Sidebar desktop (pleine largeur, labels, sans icônes) ── */}
      <aside className="dl-sidebar" aria-label="Menu latéral">
        {/* Logo */}
        <Link to="/dashboard" className="dl-sidebar-logo" aria-label="ExoCraft — Tableau de bord">
          <img src={logo} alt="ExoCraft" style={{ height: 28, width: "auto" }} />
        </Link>

        {/* Nav links */}
        <div className="dl-sidebar-body">
          <p className="dl-sidebar-label">MENU</p>
          <nav aria-label="Navigation principale">
            {menuItems.map(({ path, page, label }) => (
              <NavLink key={path} to={path}
                className={({ isActive }) =>
                  `dl-sidebar-item${isActive || activePage === page ? " active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Classes */}
          {groups.length > 0 && (
            <div className="dl-sidebar-classes" aria-label="Classes">
              <p className="dl-sidebar-label">MES CLASSES</p>
              <button type="button"
                className={`dl-sidebar-class${selectedGroup === "all" ? " active" : ""}`}
                onClick={() => onSelectGroup?.("all")}
              >Toutes les classes</button>
              {groups.map((g) => (
                <button key={g.className} type="button"
                  className={`dl-sidebar-class${selectedGroup?.className === g.className ? " active" : ""}`}
                  onClick={() => onSelectGroup?.(g)}
                >{g.className}</button>
              ))}
            </div>
          )}
        </div>

        {/* Footer sidebar */}
        <div className="dl-sidebar-footer">
          {/* Toggle thème */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 12px", marginBottom: 8,
            background: "rgba(37,99,235,0.04)",
            border: "1px solid rgba(37,99,235,0.08)",
            borderRadius: 12,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Apparence
            </span>
            <ThemeToggle />
          </div>

          <div className="dl-sidebar-user-info">
            <div className="dl-sidebar-avatar">
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email || "Utilisateur"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {user?.role === 'administrateur' ? 'Admin' : 'Enseignant'}
              </div>
            </div>
          </div>
          <button type="button" className="dl-sidebar-logout" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dl-main">

        {/* ── Topbar ── */}
        <header className="dl-topbar">
          {/* Gauche : burger + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button ref={menuButton} type="button" className="dl-burger"
              aria-expanded={menuOpen} aria-controls="dl-mobile-nav"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span /><span /><span />
            </button>
            <Link to="/dashboard" className="dl-brand">ExoCraft</Link>
            {selectedGroup && selectedGroup !== "all" && (
              <span className="dl-breadcrumb">
                {selectedGroup.className}{selectedGroup.section ? ` / ${selectedGroup.section}` : ""}
              </span>
            )}
          </div>

          {/* Droite */}
          <div className="dl-topbar-right">
            {/* Crédits */}
            {credits !== null && (
              <Link to="/pricing" style={{ textDecoration: "none" }} title="Acheter des crédits">
                <div className={`dl-credits${credits === 0 ? " empty" : ""}`}>
                  {credits} crédit{credits > 1 ? "s" : ""}
                </div>
              </Link>
            )}

            {/* User info */}
            <div className="dl-user-info">
              <span className="dl-user-role">
                {user?.role === 'administrateur' ? 'ADMINISTRATEUR' : 'ESPACE ENSEIGNANT'}
              </span>
              <span className="dl-user-email" title={user?.email}>
                {user?.email || "Utilisateur"}
              </span>
            </div>

            {/* Avatar */}
            <Link to="/settings" className="dl-avatar" aria-label="Mon profil">
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </Link>
          </div>
        </header>

        {/* Mobile nav */}
        <div id="dl-mobile-nav" className="dl-mobile-nav" hidden={!menuOpen}>
          {mobileNav}
        </div>

        {/* Page content */}
        <main id="main-content" className="dashboard-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* ── Bouton flottant IA ── */}
      <Link
        to="/ai?tab=chat"
        aria-label="Chat avec l'assistant IA"
        className="ai-fab"
      >
        {/* Icône bulle de chat SVG */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8"  cy="10" r="1" fill="white"/>
          <circle cx="12" cy="10" r="1" fill="white"/>
          <circle cx="16" cy="10" r="1" fill="white"/>
        </svg>
        <span className="ai-fab-label">Chat IA</span>
      </Link>

      {/* Styles scoped */}
      <style>{`
        /* ── Sidebar ── */
        .dl-sidebar {
          position: fixed; inset: 0 auto 0 0;
          width: 220px;
          display: flex; flex-direction: column;
          background: rgba(255,255,255,0.88);
          border-right: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 2px 0 20px rgba(37,99,235,0.07);
          z-index: 30;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        [data-theme="dark"] .dl-sidebar {
          background: rgba(7,11,26,0.92);
          border-right-color: rgba(255,255,255,0.10);
        }

        .dl-sidebar-logo {
          display: flex; align-items: center;
          height: 68px; min-height: 68px; padding: 0 20px;
          border-bottom: 1px solid rgba(255,255,255,0.75); flex-shrink: 0;
          text-decoration: none;
        }
        [data-theme="dark"] .dl-sidebar-logo { border-bottom-color: rgba(255,255,255,0.10); }

        .dl-sidebar-body {
          flex: 1; overflow-y: auto; padding: 16px 12px 8px;
        }

        .dl-sidebar-label {
          font-size: 10px; font-weight: 800; letter-spacing: 0.10em;
          color: var(--text-muted, #7A88B8); text-transform: uppercase;
          padding: 0 10px; margin: 0 0 8px;
        }

        .dl-sidebar-item {
          display: block; width: 100%;
          padding: 10px 14px; margin-bottom: 2px;
          border-radius: 12px; border: none;
          background: transparent; text-decoration: none;
          font-size: 14px; font-weight: 500;
          color: var(--text-secondary, #4A5A8C);
          cursor: pointer; text-align: left;
          transition: background 0.18s, color 0.18s, transform 0.18s;
        }
        .dl-sidebar-item:hover {
          background: rgba(37,99,235,0.08);
          color: var(--color-primary, #2563EB);
          transform: translateX(2px);
        }
        .dl-sidebar-item.active {
          background: linear-gradient(135deg, #2563EB, #4F46E5);
          color: #fff; font-weight: 700;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3);
        }

        .dl-sidebar-classes { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.75); }
        [data-theme="dark"] .dl-sidebar-classes { border-top-color: rgba(255,255,255,0.10); }

        .dl-sidebar-class {
          display: block; width: 100%;
          padding: 8px 14px; margin-bottom: 2px;
          border-radius: 10px; border: none;
          background: transparent; text-decoration: none;
          font-size: 13px; font-weight: 500;
          color: var(--text-secondary, #4A5A8C);
          cursor: pointer; text-align: left;
          transition: background 0.18s, color 0.18s;
        }
        .dl-sidebar-class:hover { background: rgba(37,99,235,0.07); color: var(--color-primary, #2563EB); }
        .dl-sidebar-class.active {
          background: rgba(37,99,235,0.12);
          color: var(--color-primary, #2563EB); font-weight: 700;
        }

        .dl-sidebar-footer {
          padding: 12px; border-top: 1px solid rgba(255,255,255,0.75); flex-shrink: 0;
        }
        [data-theme="dark"] .dl-sidebar-footer { border-top-color: rgba(255,255,255,0.10); }

        .dl-sidebar-user-info {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: 12px; margin-bottom: 8px;
          background: rgba(37,99,235,0.05);
          border: 1px solid rgba(37,99,235,0.08);
        }
        .dl-sidebar-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #2563EB, #06B6D4);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 13px;
        }
        .dl-sidebar-logout {
          width: 100%; padding: 9px 14px; border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
          color: #DC2626; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .dl-sidebar-logout:hover { background: #DC2626; color: #fff; border-color: #DC2626; }

        /* ── Main ── */
        .dl-main {
          margin-left: 220px;
          width: calc(100% - 220px);
          min-height: 100vh;
          display: flex; flex-direction: column;
          position: relative; z-index: 1;
        }

        /* ── Topbar ── */
        .dl-topbar {
          position: sticky; top: 0; z-index: 20;
          min-height: 68px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 0 clamp(16px, 3vw, 36px);
          background: rgba(255,255,255,0.88);
          border-bottom: 1px solid rgba(255,255,255,0.75);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 20px rgba(37,99,235,0.07);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        [data-theme="dark"] .dl-topbar {
          background: rgba(7,11,26,0.90);
          border-bottom-color: rgba(255,255,255,0.10);
        }

        .dl-brand {
          font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
          font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
          color: var(--text-primary, #0B1B4D); text-decoration: none;
        }
        .dl-breadcrumb {
          font-size: 12px; color: var(--text-muted, #7A88B8);
          padding: 4px 12px;
          background: rgba(37,99,235,0.07);
          border: 1px solid rgba(37,99,235,0.14);
          border-radius: 20px;
        }
        .dl-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .dl-credits {
          padding: 5px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
          background: rgba(37,99,235,0.10);
          border: 1px solid rgba(37,99,235,0.18);
          color: var(--color-primary, #2563EB);
          cursor: pointer; white-space: nowrap;
          transition: all 0.2s;
        }
        .dl-credits:hover { background: rgba(37,99,235,0.16); }
        .dl-credits.empty {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #DC2626;
        }

        .dl-user-info {
          display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
        }
        .dl-user-role {
          font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
          color: var(--text-muted, #7A88B8); text-transform: uppercase;
        }
        .dl-user-email {
          max-width: 180px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; font-size: 12px;
          color: var(--text-primary, #0B1B4D); font-weight: 500;
        }
        .dl-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #2563EB, #06B6D4);
          color: #fff; font-weight: 700; font-size: 14px;
          text-decoration: none;
          display: grid; place-items: center; flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(37,99,235,0.35);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .dl-avatar:hover { box-shadow: 0 4px 20px rgba(37,99,235,0.5); transform: scale(1.06); }

        /* ── Burger ── */
        .dl-burger {
          display: none; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 5px; width: 40px; height: 40px; padding: 0;
          border: 1px solid rgba(255,255,255,0.75); border-radius: 10px;
          background: rgba(255,255,255,0.60); backdrop-filter: blur(12px);
          cursor: pointer;
        }
        .dl-burger span {
          display: block; width: 16px; height: 2px; border-radius: 1px;
          background: var(--text-primary, #0B1B4D); transition: all 0.3s;
        }

        /* ── Mobile nav ── */
        .dl-mobile-nav:not([hidden]) {
          display: block; padding: 16px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.75);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        [data-theme="dark"] .dl-mobile-nav:not([hidden]) {
          background: rgba(7,11,26,0.95);
          border-bottom-color: rgba(255,255,255,0.10);
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .dl-sidebar { display: none; }
          .dl-main { margin-left: 0; width: 100%; }
          .dl-topbar { min-height: 60px; }
          .dl-burger { display: flex; }
          .dl-user-info { display: none; }
        }
        @media (max-width: 600px) {
          .dl-topbar { padding: 0 16px; }
        }

        /* ── Bouton flottant IA ── */
        .ai-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px 0 16px;
          height: 52px;
          border-radius: 26px;
          background: linear-gradient(135deg, #2563EB, #4F46E5);
          color: #fff;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 28px rgba(37,99,235,0.45);
          border: 1.5px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(.22,1,.36,1);
          overflow: hidden;
          white-space: nowrap;
        }
        .ai-fab::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          border-radius: inherit;
          pointer-events: none;
        }
        .ai-fab:hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 14px 40px rgba(37,99,235,0.6);
        }
        .ai-fab:active {
          transform: scale(0.96);
          box-shadow: 0 4px 16px rgba(37,99,235,0.4);
        }
        .ai-fab-label {
          position: relative;
          z-index: 1;
          letter-spacing: -0.01em;
        }
        /* Pulse ring autour du FAB */
        .ai-fab::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 32px;
          border: 2px solid rgba(37,99,235,0.35);
          animation: fabPulse 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes fabPulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 0;   transform: scale(1.12); }
        }
        @media (max-width: 600px) {
          .ai-fab { bottom: 20px; right: 16px; padding: 0 14px; height: 48px; }
          .ai-fab-label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-fab::after { animation: none; }
          .ai-fab { transition: none; }
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;
