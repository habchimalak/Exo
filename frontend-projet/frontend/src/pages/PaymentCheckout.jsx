import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentApi } from "../services/api";

// Infos des packs (miroir de plans.ts, pour affichage sans appel API)
const PACKS = {
  starter: { nom: "Starter",  credits: 50,  prix: "9 TND",  color: "#6c5ce7" },
  pro:     { nom: "Pro",      credits: 200, prix: "29 TND", color: "#a855f7" },
  premium: { nom: "Premium",  credits: 500, prix: "59 TND", color: "#7c3aed" },
};

export default function PaymentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get("token");

  const [pack, setPack]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Décoder le token pour extraire le packId
  useEffect(() => {
    if (!token) { navigate("/pricing"); return; }
    try {
      // base64url → base64 standard (ajouter le padding manquant)
      const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
      const decoded = atob(padded);
      const packId  = decoded.split(":")[1];
      setPack(PACKS[packId] ?? null);
    } catch {
      navigate("/pricing");
    }
  }, [token, navigate]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentApi.verify(token);
      if (data.success) {
        // Stocker les infos pour la page success
        localStorage.setItem("exocraft_last_payment", JSON.stringify({
          credits: data.credits,
          message: data.message,
        }));
        navigate("/payment/success");
      } else {
        setError(data.message || "Erreur lors de la confirmation.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Erreur inattendue.");
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/payment/fail");

  if (!pack) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        margin: "1rem",
      }}>

        {/* Header Konnect-style */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px 20px 0 0",
          padding: "1.5rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", gap: "1rem",
        }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, #6c5ce7, #a855f7)",
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem",
          }}>⚡</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
              PLATEFORME DE PAIEMENT
            </div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
              ExoCraft Pay
            </div>
          </div>
          <div style={{
            marginLeft: "auto",
            background: "rgba(108,92,231,0.3)",
            border: "1px solid rgba(108,92,231,0.5)",
            borderRadius: 20, padding: "3px 12px",
            color: "#a78bfa", fontSize: "0.75rem", fontWeight: 600,
          }}>
            🔒 SÉCURISÉ
          </div>
        </div>

        {/* Corps */}
        <div style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          padding: "2rem",
        }}>
          {/* Récapitulatif commande */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 14, padding: "1.25rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginBottom: 8 }}>
              RÉCAPITULATIF DE COMMANDE
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                  Pack {pack.nom}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                  {pack.credits} crédits IA · ExoCraft
                </div>
              </div>
              <div style={{
                color: "#a78bfa", fontWeight: 900, fontSize: "1.5rem",
              }}>
                {pack.prix}
              </div>
            </div>
          </div>

          {/* Méthode de paiement simulée */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginBottom: 10 }}>
              MÉTHODE DE PAIEMENT
            </div>
            <div style={{
              background: "rgba(108,92,231,0.15)",
              border: "2px solid rgba(108,92,231,0.5)",
              borderRadius: 12, padding: "1rem",
              display: "flex", alignItems: "center", gap: "0.75rem",
              cursor: "default",
            }}>
              <span style={{ fontSize: "1.5rem" }}>💳</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 600 }}>Carte bancaire</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                  CIB · e-Dinar · Visa · Mastercard
                </div>
              </div>
              <div style={{
                marginLeft: "auto", width: 18, height: 18,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6c5ce7, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", color: "#fff",
              }}>✓</div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 10, padding: "0.75rem 1rem",
              color: "#fca5a5", fontSize: "0.85rem",
              marginBottom: "1rem",
            }}>
              ❌ {error}
            </div>
          )}

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "rgba(108,92,231,0.4)"
                : "linear-gradient(135deg, #6c5ce7, #a855f7)",
              color: "#fff", border: "none", borderRadius: 14,
              padding: "1rem", fontWeight: 700, fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "0.75rem",
              transition: "all 0.2s",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.5rem",
            }}
          >
            {loading ? (
              <>⏳ Traitement en cours…</>
            ) : (
              <>✅ Confirmer le paiement · {pack.prix}</>
            )}
          </button>

          {/* Bouton annuler */}
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              width: "100%",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "0.75rem",
              fontWeight: 500, fontSize: "0.9rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Annuler
          </button>
        </div>

        {/* Footer */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
          borderRadius: "0 0 20px 20px",
          padding: "1rem 2rem",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: 0 }}>
            🔒 Paiement simulé · Mode développement · ExoCraft v2
          </p>
        </div>
      </div>
    </div>
  );
}
