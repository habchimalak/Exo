import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/exocraft-logo.png";
import {
  validateEmail, validatePassword, validatePasswordStrength,
  validateConfirmPassword, validateName, runValidation,
} from "../utils/validators";

/* ─── Indicateur de force du mot de passe ──────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const issues = validatePasswordStrength(password);
  const strength = issues.length === 0 ? 3 : issues.length <= 1 ? 2 : 1;
  const labels = ["Faible", "Moyen", "Fort"];
  const colors = ["#EF4444", "#F59E0B", "#10B981"];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= strength ? colors[strength - 1] : "#E5E7EB",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[strength - 1], fontWeight: 600 }}>
        {labels[strength - 1]}
        {issues.length > 0 && ` — manque : ${issues.join(", ")}`}
      </span>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setForm(cur => ({ ...cur, [name]: value }));
    if (errors[name]) setErrors(cur => ({ ...cur, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    const errs = runValidation({
      firstName:       validateName(form.firstName, "Le prénom"),
      lastName:        validateName(form.lastName,  "Le nom"),
      email:           validateEmail(form.email),
      password:        validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        email:        form.email.trim(),
        password:     form.password,
        associations: [],
      });
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-logo-link">
          <img src={logo} alt="ExoCraft" className="auth-logo" />
        </Link>
        <div className="auth-header-text">
          <span>Vous avez déjà un compte ?</span>
          <Link to="/login">Se connecter</Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-container">

          <div className="auth-heading">
            <span className="auth-eyebrow">CRÉER VOTRE ESPACE ENSEIGNANT</span>
            <h1>Rejoignez ExoCraft</h1>
            <p>Créez votre compte en quelques secondes.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Prénom + Nom */}
            <div className="registration-name-grid">
              <div className="form-group">
                <label htmlFor="firstName">
                  Prénom <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="firstName" name="firstName" value={form.firstName}
                  onChange={update} autoComplete="given-name"
                  style={{ borderColor: errors.firstName ? "#EF4444" : undefined }}
                />
                {errors.firstName && (
                  <p style={{ color:"#EF4444", fontSize:12, margin:"4px 0 0" }} role="alert">
                    ⚠ {errors.firstName}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">
                  Nom <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="lastName" name="lastName" value={form.lastName}
                  onChange={update} autoComplete="family-name"
                  style={{ borderColor: errors.lastName ? "#EF4444" : undefined }}
                />
                {errors.lastName && (
                  <p style={{ color:"#EF4444", fontSize:12, margin:"4px 0 0" }} role="alert">
                    ⚠ {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Adresse email <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="email" id="email" name="email" value={form.email}
                placeholder="exemple@email.com" onChange={update}
                autoComplete="email"
                style={{ borderColor: errors.email ? "#EF4444" : undefined }}
              />
              {errors.email && (
                <p style={{ color:"#EF4444", fontSize:12, margin:"4px 0 0" }} role="alert">
                  ⚠ {errors.email}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="password">
                Mot de passe <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  id="password" name="password" value={form.password}
                  onChange={update} autoComplete="new-password"
                  style={{ borderColor: errors.password ? "#EF4444" : undefined, paddingRight: 44, width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    padding: 4, color: "var(--text-muted, #9ca3af)",
                    fontSize: 18, lineHeight: 1,
                  }}
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <p style={{ color:"#EF4444", fontSize:12, margin:"4px 0 0" }} role="alert">
                  ⚠ {errors.password}
                </p>
              )}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirmation */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmer le mot de passe <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword" name="confirmPassword"
                  value={form.confirmPassword} onChange={update}
                  autoComplete="new-password"
                  style={{ borderColor: errors.confirmPassword ? "#EF4444" : undefined, paddingRight: 44, width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    padding: 4, color: "var(--text-muted, #9ca3af)",
                    fontSize: 18, lineHeight: 1,
                  }}
                  aria-label={showConfirm ? "Masquer" : "Afficher"}
                >
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p style={{ color:"#EF4444", fontSize:12, margin:"4px 0 0" }} role="alert">
                  ⚠ {errors.confirmPassword}
                </p>
              )}
            </div>

            {globalError && (
              <div className="auth-error" role="alert">{globalError}</div>
            )}

            <button type="submit" className="auth-button" disabled={loading}>
              <span>{loading ? "Création en cours..." : "Créer mon compte"}</span>
              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="auth-bottom">
            <span>Vous avez déjà un compte ?</span>
            <Link to="/login">Se connecter</Link>
          </div>

          <div className="auth-security">
            <span>🔒</span>
            <p>Vos informations de compte sont protégées.</p>
          </div>

        </div>
      </main>
    </div>
  );
}
