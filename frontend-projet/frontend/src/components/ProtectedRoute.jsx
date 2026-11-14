import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Vérifie que l'utilisateur est connecté ET que son token JWT est encore valide.
 * On décode la date d'expiration (exp) du payload JWT côté client pour éviter
 * un aller-retour réseau inutile à chaque changement de route.
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp est en secondes depuis epoch
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true; // token malformé → considéré expiré
  }
}

function ProtectedRoute({ children }) {
  const { user, logout } = useAuth();
  const [checked, setChecked] = useState(false);
  const [valid,   setValid]   = useState(false);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      setValid(false);
      return;
    }

    const token = localStorage.getItem("exocraft_token");
    if (!token || isTokenExpired(token)) {
      // Token absent ou expiré : déconnecter proprement
      logout();
      setValid(false);
    } else {
      setValid(true);
    }
    setChecked(true);
  }, [user, logout]);

  // Pendant la vérification, ne rien rendre (évite le flash de contenu)
  if (!checked) return null;

  if (!valid) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
