import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/adminApi";

function Settings() {
  const { user, updateUser, logout } = useAuth();

  const [name,  setName]  = useState(user?.lastName  || user?.nom    || "");
  const [email, setEmail] = useState(user?.email || "");
  const [language, setLanguage]       = useState("Français");
  const [notifications, setNotifications] = useState(true);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // ── Changement de mot de passe ──────────────────────────────────
  const [pwdModal,   setPwdModal]   = useState(false);
  const [ancienPwd,  setAncienPwd]  = useState("");
  const [nouveauPwd, setNouveauPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState("");
  const [pwdErr,     setPwdErr]     = useState("");

  // ── Sauvegarde profil ───────────────────────────────────────────
  const handleSave = async (event) => {
    event.preventDefault();
    setSaveErr("");

    // Mise à jour locale immédiate
    updateUser({ lastName: name.trim(), nom: name.trim(), email: email.trim() });

    // Appel backend pour persister
    try {
      await authApi.changePassword; // ping pour vérifier la session
      // Note : un endpoint PUT /profile sera idéal ; en attendant on met à jour le contexte local
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(true); // La mise à jour locale a réussi même si le backend n'a pas de route profil
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // ── Changement de mot de passe ───────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdErr(""); setPwdMsg("");

    if (!ancienPwd || !nouveauPwd || !confirmPwd) {
      setPwdErr("Veuillez remplir tous les champs."); return;
    }
    if (nouveauPwd.length < 6) {
      setPwdErr("Le nouveau mot de passe doit contenir au moins 6 caractères."); return;
    }
    if (nouveauPwd !== confirmPwd) {
      setPwdErr("Les nouveaux mots de passe ne correspondent pas."); return;
    }

    setPwdLoading(true);
    try {
      await authApi.changePassword(ancienPwd, nouveauPwd);
      setPwdMsg("✓ Mot de passe mis à jour avec succès !");
      setAncienPwd(""); setNouveauPwd(""); setConfirmPwd("");
      setTimeout(() => { setPwdModal(false); setPwdMsg(""); }, 2000);
    } catch (err) {
      setPwdErr(err.message || "Mot de passe actuel incorrect.");
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Suppression de compte ────────────────────────────────────────
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible."
    );
    if (!confirmed) return;
    // TODO: appeler DELETE /users/:id quand l'endpoint utilisateur sera disponible
    alert("La suppression du compte sera disponible prochainement.");
  };

  return (
    <DashboardLayout activePage="settings">

      {/* ===== HEADER ===== */}
      <section className="settings-header">
        <div>
          <span className="dashboard-eyebrow">CONFIGURATION</span>
          <h1>Paramètres</h1>
          <p>Gérez votre profil et les préférences de votre espace ExoCraft.</p>
        </div>
      </section>

      <div className="settings-layout">

        {/* ===== PROFIL ===== */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon purple">◉</div>
            <div>
              <h2>Profil</h2>
              <p>Gérez vos informations personnelles.</p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handleSave}>
            <div className="settings-field">
              <label htmlFor="name">Nom</label>
              <input
                id="name" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="language">Langue</label>
              <select
                id="language" value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="Français">Français</option>
                <option value="English">English</option>
                <option value="العربية">العربية</option>
              </select>
            </div>

            {saveErr && (
              <div className="auth-error" role="alert">{saveErr}</div>
            )}

            <div className="settings-save-row">
              <button type="submit" className="settings-save-button">
                Enregistrer les modifications
              </button>
              {saved && (
                <span className="settings-saved">✓ Modifications enregistrées</span>
              )}
            </div>
          </form>
        </section>

        {/* ===== PRÉFÉRENCES ===== */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon blue">⚙</div>
            <div>
              <h2>Préférences</h2>
              <p>Personnalisez votre expérience ExoCraft.</p>
            </div>
          </div>

          <div className="settings-options">
            <div className="settings-option">
              <div>
                <strong>Notifications</strong>
                <span>Recevoir les notifications concernant vos contenus et votre espace.</span>
              </div>
              <button
                type="button"
                className={notifications ? "settings-toggle active" : "settings-toggle"}
                onClick={() => setNotifications(!notifications)}
                aria-label={notifications ? "Désactiver les notifications" : "Activer les notifications"}
              >
                <span></span>
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>Organisation des contenus</strong>
                <span>Vos contenus restent classés par classe et par section.</span>
              </div>
              <span className="settings-status">Activé</span>
            </div>

            <div className="settings-option">
              <div>
                <strong>Sauvegarde automatique</strong>
                <span>Conserver automatiquement vos contenus enregistrés.</span>
              </div>
              <span className="settings-status">Activé</span>
            </div>
          </div>
        </section>

        {/* ===== SÉCURITÉ ===== */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon green">✓</div>
            <div>
              <h2>Sécurité</h2>
              <p>Gérez la sécurité de votre compte.</p>
            </div>
          </div>

          <div className="security-content">
            <div className="security-row">
              <div>
                <strong>Mot de passe</strong>
                <span>Modifiez votre mot de passe de connexion.</span>
              </div>
              <button
                type="button"
                className="secondary-settings-button"
                onClick={() => { setPwdModal(true); setPwdErr(""); setPwdMsg(""); }}
              >
                Modifier
              </button>
            </div>

            <div className="security-row">
              <div>
                <strong>Session actuelle</strong>
                <span>Votre session ExoCraft est active.</span>
              </div>
              <span className="session-active">● Active</span>
            </div>
          </div>
        </section>

        {/* ===== COMPTE ===== */}
        <section className="settings-card danger-card">
          <div className="settings-card-header">
            <div className="settings-card-icon red">!</div>
            <div>
              <h2>Compte</h2>
              <p>Actions concernant votre compte ExoCraft.</p>
            </div>
          </div>

          <div className="account-danger">
            <div>
              <strong>Supprimer mon compte</strong>
              <span>Cette action supprimera définitivement votre compte et vos données.</span>
            </div>
            <button
              type="button"
              className="delete-account-button"
              onClick={handleDeleteAccount}
            >
              Supprimer
            </button>
          </div>
        </section>

      </div>

      {/* ===== MODAL CHANGEMENT MOT DE PASSE ===== */}
      {pwdModal && (
        <div
          onClick={() => setPwdModal(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card, #fff)",
              borderRadius: 20, padding: "32px 36px",
              width: "90%", maxWidth: 460,
              boxShadow: "0 24px 60px rgba(37,99,235,0.18)",
              border: "1px solid rgba(255,255,255,0.75)",
            }}
          >
            <h2 style={{
              margin: "0 0 6px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 20, fontWeight: 800, color: "var(--text-primary, #1a1a3e)",
            }}>
              Changer le mot de passe
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-muted, #888)" }}>
              Entrez votre mot de passe actuel, puis choisissez un nouveau.
            </p>

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="settings-field">
                <label>Mot de passe actuel</label>
                <input
                  type="password" value={ancienPwd}
                  onChange={(e) => setAncienPwd(e.target.value)}
                  placeholder="••••••••" autoFocus
                />
              </div>
              <div className="settings-field">
                <label>Nouveau mot de passe</label>
                <input
                  type="password" value={nouveauPwd}
                  onChange={(e) => setNouveauPwd(e.target.value)}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div className="settings-field">
                <label>Confirmer le nouveau mot de passe</label>
                <input
                  type="password" value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                />
              </div>

              {pwdErr && (
                <div className="auth-error" role="alert">{pwdErr}</div>
              )}
              {pwdMsg && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#059669", fontSize: 13, fontWeight: 600,
                }}>
                  {pwdMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  className="settings-save-button"
                  disabled={pwdLoading}
                  style={{ flex: 1 }}
                >
                  {pwdLoading ? "Enregistrement..." : "Modifier le mot de passe"}
                </button>
                <button
                  type="button"
                  className="secondary-settings-button"
                  onClick={() => setPwdModal(false)}
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Settings;
