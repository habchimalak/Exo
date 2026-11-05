import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/exocraft-logo.png";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      return setError("Veuillez renseigner tous les champs.");
    }
    if (form.password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (form.password !== form.confirmPassword) return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        password:  form.password,
        associations: [], // les classes/matières sont assignées par l'admin
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
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
            <p>Créez votre compte. L'administrateur vous assignera vos classes et matières.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>

            <div className="registration-name-grid">
              <div className="form-group">
                <label htmlFor="firstName">Prénom</label>
                <input id="firstName" name="firstName" value={form.firstName}
                  onChange={update} autoComplete="given-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Nom</label>
                <input id="lastName" name="lastName" value={form.lastName}
                  onChange={update} autoComplete="family-name" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input type="email" id="email" name="email" value={form.email}
                placeholder="exemple@email.com" onChange={update}
                autoComplete="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input type="password" id="password" name="password" value={form.password}
                onChange={update} autoComplete="new-password" required />
              <span className="auth-input-hint">Minimum 6 caractères</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input type="password" id="confirmPassword" name="confirmPassword"
                value={form.confirmPassword} onChange={update}
                autoComplete="new-password" required />
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

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
