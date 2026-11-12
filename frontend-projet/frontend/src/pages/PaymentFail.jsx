import { useNavigate } from "react-router-dom";

export default function PaymentFail() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "3rem 2.5rem",
        textAlign: "center", maxWidth: 480, width: "90%",
        boxShadow: "0 8px 40px rgba(229,62,62,0.12)",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>😞</div>
        <h2 style={{ color: "#e53e3e", margin: "0 0 0.5rem" }}>Paiement annulé</h2>
        <p style={{ color: "#555", marginBottom: "2rem" }}>
          Votre paiement n'a pas été complété. Aucun montant n'a été débité.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              background: "#6c5ce7", color: "#fff",
              border: "none", borderRadius: 12,
              padding: "0.75rem 2rem", fontWeight: 700,
              fontSize: "1rem", cursor: "pointer",
            }}
          >
            Réessayer le paiement
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
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
