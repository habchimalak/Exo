import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import logo from "../assets/exocraft-logo.png";
import {
  validateEmail, validatePassword, validatePasswordStrength,
  validateConfirmPassword, validateName, validateOtp, runValidation,
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

/* ─── Champ de saisie du code OTP ──────────────────────────────── */
function OtpInput({ value, onChange, error }) {
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/, "");
    const chars = value.split("");
    chars[i] = val;
    onChange(chars.join(""));
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, ""));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "8px 0" }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 48, height: 56, textAlign: "center",
              fontSize: 22, fontWeight: 800,
              border: `2px solid ${error ? "#EF4444" : value[i] ? "#2563EB" : "#D1D5DB"}`,
              borderRadius: 12,
              background: value[i] ? "#EFF6FF" : "#fff",
              color: "#1a1a3e", outline: "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
          />
        ))}
      </div>
      {error && (
        <p role="alert" style={{ color: "#EF4444", fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Étapes : "form" → "otp" → (register réussi → "/dashboard")
  const [step, setStep] = useState("form");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // OTP
  const [otpCode,     setOtpCode]     = useState("");
  const [otpError,    setOtpError]    = useState("");
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm(cur => ({ ...cur, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) setErrors(cur => ({ ...cur, [name]: null }));
  };

  /* ── Étape 1 : validation du formulaire + envoi OTP ── */
  const handleSubmitForm = async (e) => {
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
      await authApi.sendOtp(form.email.trim());
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      setGlobalError(err.message || "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Renvoyer le code OTP ── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtpError("");
    setOtpLoading(true);
    try {
      await authApi.sendOtp(form.email.trim());
      setResendTimer(60);
      setOtpCode("");
    } catch (err) {
      setOtpError(err.message || "Impossible de renvoyer le code.");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Étape 2 : vérification OTP + inscription ── */
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setOtpError("");

    const otpErr = validateOtp(otpCode);
    if (otpErr) { setOtpError(otpErr); return; }

    setOtpLoading(true);
    try {
      // 1. Vérifier le code
      await authApi.verifyOtp(form.email.trim(), otpCode.trim());

      // 2. Créer le compte
      await register({
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        email:        form.email.trim(),
        password:     form.password,
        associations: [],
      });
      navigate("/dashboard");
    } catch (err) {
      setOtpError(err.message || "Code incorrect ou expiré.");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ══════════════════ RENDU ══════════════════ */

  /* ── Étape OTP ── */
  if (step === "otp") {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <Link to="/" className="auth-logo-link">
            <img src={logo} alt="ExoCraft" className="auth-logo" />
          </Link>
        </header>

        <main className="auth-main">
          <div className="auth-container">
            <div className="auth-heading">
              <span className="auth-eyebrow">VÉRIFICATION EMAIL</span>
              <h1>Vérifiez votre email</h1>
              <p>
                Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.
                Saisissez-le ci-dessous pour confirmer votre inscription.
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="auth-form">
              <OtpInput value={otpCode} onChange={setOtpCode} error={otpError} />

              {/* Timer + renvoi */}
              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted, #9ca3af)" }}>
                {resendTimer > 0 ? (
                  <span>Renvoyer dans <strong style={{ color: "#2563EB" }}>{resendTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={otpLoading}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#2563EB", fontWeight: 600, fontSize: 13, padding: 0,
                    }}
                  >
                    {otpLoading ? "Envoi…" : "Renvoyer le code"}
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={otpLoading || otpCode.length < 6}
                style={{ marginTop: 24 }}
              >
                <span>{otpLoading ? "Vérification…" : "Confirmer et créer mon compte"}</span>
                {!otpLoading && <span>→</span>}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setStep("form"); setOtpCode(""); setOtpError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted, #9ca3af)", fontSize: 13,
                }}
              >
                ← Modifier mon email
              </button>
            </div>

            <div className="auth-security">
              <span>🔒</span>
              <p>Code valable 10 minutes · 5 tentatives maximum.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Étape formulaire ── */
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
            <p>Créez votre compte. Un code de vérification sera envoyé à votre email.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmitForm} noValidate>

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
                  <p className="auth-field-error" role="alert">⚠ {errors.firstName}</p>
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
                  <p className="auth-field-error" role="alert">⚠ {errors.lastName}</p>
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
                <p className="auth-field-error" role="alert">⚠ {errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="password">
                Mot de passe <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="password" id="password" name="password" value={form.password}
                onChange={update} autoComplete="new-password"
                style={{ borderColor: errors.password ? "#EF4444" : undefined }}
              />
              {errors.password && (
                <p className="auth-field-error" role="alert">⚠ {errors.password}</p>
              )}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirmation */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmer le mot de passe <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="password" id="confirmPassword" name="confirmPassword"
                value={form.confirmPassword} onChange={update}
                autoComplete="new-password"
                style={{ borderColor: errors.confirmPassword ? "#EF4444" : undefined }}
              />
              {errors.confirmPassword && (
                <p className="auth-field-error" role="alert">⚠ {errors.confirmPassword}</p>
              )}
            </div>

            {globalError && (
              <div className="auth-error" role="alert">{globalError}</div>
            )}

            <button type="submit" className="auth-button" disabled={loading}>
              <span>{loading ? "Envoi du code…" : "Continuer →"}</span>
            </button>

          </form>

          <div className="auth-bottom">
            <span>Vous avez déjà un compte ?</span>
            <Link to="/login">Se connecter</Link>
          </div>

          <div className="auth-security">
            <span>🔒</span>
            <p>Un code de vérification sera envoyé à votre adresse email.</p>
          </div>

        </div>
      </main>
    </div>
  );
}
