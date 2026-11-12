import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { paymentApi } from "../services/api";

// ── Carte d'un pack ───────────────────────────────────────────────────────────
function PlanCard({ pack, onBuy, loading }) {
  return (
    <div style={{
      background: pack.populaire ? "linear-gradient(135deg, #6c5ce7, #a855f7)" : "#fff",
      color: pack.populaire ? "#fff" : "#292642",
      border: pack.populaire ? "none" : "2px solid #e9e6f8",
      borderRadius: 20,
      padding: "2rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
      position: "relative",
      boxShadow: pack.populaire
        ? "0 8px 32px rgba(108,92,231,0.35)"
        : "0 2px 12px rgba(80,70,180,0.07)",
      transform: pack.populaire ? "scale(1.05)" : "scale(1)",
      transition: "transform 0.2s",
      minWidth: 220,
      flex: 1,
    }}>
      {pack.populaire && (
        <span style={{
          position: "absolute", top: -14,
          background: "#f7c59f", color: "#7c3aed",
          fontWeight: 700, fontSize: 12,
          padding: "4px 16px", borderRadius: 20,
        }}>
          ⭐ Populaire
        </span>
      )}

      <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{pack.nom}</h3>

      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "2.5rem", fontWeight: 900 }}>{pack.prixAffiche}</span>
        <span style={{ fontSize: "0.9rem", opacity: 0.75 }}> / une fois</span>
      </div>

      <div style={{
        background: pack.populaire ? "rgba(255,255,255,0.15)" : "#f3f0ff",
        borderRadius: 12, padding: "0.75rem 1.5rem",
        textAlign: "center",
      }}>
        <span style={{
          fontSize: "2rem", fontWeight: 900,
          color: pack.populaire ? "#fff" : "#6c5ce7",
        }}>
          {pack.credits}
        </span>
        <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>crédits IA</div>
      </div>

      <ul style={{
        listStyle: "none", padding: 0, margin: 0,
        fontSize: "0.9rem", width: "100%",
        opacity: 0.9,
      }}>
        <li>✅ Génération quiz, cours, examens</li>
        <li>✅ Chat IA illimité dans le pack</li>
        <li>✅ Export PDF / Word</li>
        {pack.id === "pro"     && <li>✅ Variantes de quiz</li>}
        {pack.id === "premium" && <li>✅ Variantes de quiz</li>}
        {pack.id === "premium" && <li>✅ Google Forms sync</li>}
      </ul>

      <button
        onClick={() => onBuy(pack.id)}
        disabled={loading === pack.id}
        style={{
          marginTop: "auto",
          background: pack.populaire ? "#fff" : "#6c5ce7",
          color: pack.populaire ? "#6c5ce7" : "#fff",
          border: "none",
          borderRadius: 12,
          padding: "0.75rem 2rem",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: loading === pack.id ? "not-allowed" : "pointer",
          opacity: loading === pack.id ? 0.7 : 1,
          width: "100%",
          transition: "opacity 0.2s",
        }}
      >
        {loading === pack.id ? "Redirection…" : "Acheter"}
      </button>
    </div>
  );
}

// ── Page Pricing ──────────────────────────────────────────────────────────────
export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans]     = useState([]);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan]       = useState("free");
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    paymentApi.getPlans().then(setPlans).catch(console.error);
    paymentApi.myCredits()
      .then((d) => { setCredits(d.credits); setPlan(d.plan); })
      .catch(console.error);
  }, []);

  const handleBuy = async (packId) => {
    setLoading(packId);
    setError(null);
    try {
      const { url } = await paymentApi.initiate(packId);
      // Rediriger vers la page de paiement Konnect
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Erreur lors de l'initiation du paiement.");
      setLoading(null);
    }
  };

  return (
    <DashboardLayout activePage="pricing">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span style={{
            background: "#ede9fe", color: "#6c5ce7",
            borderRadius: 20, padding: "4px 16px",
            fontSize: 13, fontWeight: 600,
          }}>
            CRÉDITS IA
          </span>
          <h1 style={{ margin: "0.75rem 0 0.5rem", color: "#30247d", fontSize: "2rem" }}>
            Choisissez votre pack
          </h1>
          <p style={{ color: "#666", margin: 0 }}>
            Chaque génération IA consomme 1 crédit. Achetez une fois, utilisez quand vous voulez.
          </p>
        </div>

        {/* Solde actuel */}
        {credits !== null && (
          <div style={{
            background: "linear-gradient(90deg, #ede9fe, #f3e8ff)",
            borderRadius: 14, padding: "1rem 1.5rem",
            display: "flex", alignItems: "center", gap: "1rem",
            marginBottom: "2rem", border: "1px solid #ddd6fe",
          }}>
            <span style={{ fontSize: "2rem" }}>💳</span>
            <div>
              <div style={{ fontWeight: 700, color: "#30247d" }}>
                Votre solde actuel : <span style={{ color: "#6c5ce7" }}>{credits} crédits</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>
                Plan : <strong>{plan}</strong>
                {credits === 0 && (
                  <span style={{ color: "#e53e3e", marginLeft: 8 }}>
                    ⚠️ Plus de crédits — achetez un pack pour continuer
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            background: "#fff5f5", border: "1px solid #fed7d7",
            color: "#c53030", borderRadius: 10, padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
          }}>
            ❌ {error}
          </div>
        )}

        {/* Packs */}
        <div style={{
          display: "flex", gap: "1.5rem",
          flexWrap: "wrap", justifyContent: "center",
          alignItems: "flex-start",
        }}>
          {plans.map((pack) => (
            <PlanCard
              key={pack.id}
              pack={pack}
              onBuy={handleBuy}
              loading={loading}
            />
          ))}
        </div>

        {/* Note bas de page */}
        <p style={{
          textAlign: "center", color: "#aaa",
          fontSize: "0.8rem", marginTop: "2rem",
        }}>
          Paiement sécurisé via Konnect · Cartes bancaires tunisiennes acceptées (CIB, e-Dinar, wallet Konnect)
        </p>
      </div>
    </DashboardLayout>
  );
}
