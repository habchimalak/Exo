/**
 * FormField — champ de formulaire avec label + message d'erreur inline.
 * Usage :
 *   <FormField label="Email" error={errors.email}>
 *     <input ... />
 *   </FormField>
 */
export default function FormField({ label, error, hint, children, required = false }) {
  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: "block",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13, fontWeight: 600,
          color: "var(--text-primary, #1a1a3e)",
          marginBottom: 6,
        }}>
          {label}
          {required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
        </label>
      )}

      {/* Enveloppe pour bordure rouge si erreur */}
      <div style={{ position: "relative" }}>
        {children}
      </div>

      {/* Message d'erreur */}
      {error && (
        <p role="alert" style={{
          margin: "5px 0 0",
          fontSize: 12, fontWeight: 500,
          color: "#EF4444",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span>⚠</span> {error}
        </p>
      )}

      {/* Hint (aide, pas erreur) */}
      {hint && !error && (
        <p style={{
          margin: "5px 0 0",
          fontSize: 12, color: "var(--text-muted, #9ca3af)",
        }}>
          {hint}
        </p>
      )}
    </div>
  );
}
