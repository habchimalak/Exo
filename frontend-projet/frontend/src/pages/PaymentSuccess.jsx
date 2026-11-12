import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Le verify a déjà été fait dans PaymentCheckout avant la redirection
// Ici on affiche juste la confirmation avec les données passées en query string
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  // Ces valeurs sont stockées dans localStorage par PaymentCheckout
  const [credits, setCredits] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Lire les infos stockées par PaymentCheckout
    const stored = localStorage.getItem("exocraft_last_payment");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCredits(data.credits);
        setMessage(data.message);
        localStorage.removeItem("exocraft_last_payment");
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "3rem 2.5rem",
        textAlign: "center", maxWidth: 480, width: "90%",
        boxShadow: "0 8px 40px rgba(34,197,94,0.15)",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ color: "#16a34a", margin: "0 0 0.5rem", fontSize: "1.75rem" }}>
          Paiement confirmé !
        </h2>
        <p style={{ color: "#555", marginBottom: "1.5rem" }}>
          {message || "Vos crédits ont été ajoutés avec succès."}
        </p>

        {credits !== null && (
          <div style={{
            background: "#f0fdf4", border: "2px solid #bbf7d0",
            borderRadius: 16, padding: "1.25rem",
            marginBottom: "2rem",
          }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "#16a34a" }}>
              {credits}
            </div>
            <div style={{ color: "#166534", fontWeight: 600 }}>
              crédits IA disponibles
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/ai")}
            style={{
              background: "linear-gradient(135deg, #6c5ce7, #a855f7)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "0.9rem 2rem", fontWeight: 700,
              fontSize: "1rem", cursor: "pointer",
            }}
          >
            ✨ Générer du contenu IA
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "transparent", color: "#6c5ce7",
              border: "2px solid #6c5ce7", borderRadius: 12,
              padding: "0.75rem 2rem", fontWeight: 600,
              fontSize: "1rem", cursor: "pointer",
            }}
          >
            Tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
