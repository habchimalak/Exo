import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      aria-checked={isDark}
      role="switch"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0",
        border: "none",
        background: "none",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {/* Label */}
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        color: "var(--text-muted, #7A88B8)",
        textTransform: "uppercase",
        userSelect: "none",
      }}>
        {isDark ? "Sombre" : "Clair"}
      </span>

      {/* Track */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 24,
        borderRadius: 12,
        background: isDark
          ? "linear-gradient(135deg, #2563EB, #4F46E5)"
          : "rgba(37,99,235,0.15)",
        border: isDark
          ? "1.5px solid rgba(37,99,235,0.6)"
          : "1.5px solid rgba(37,99,235,0.25)",
        padding: "0 3px",
        transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
        boxSizing: "border-box",
        boxShadow: isDark ? "0 0 10px rgba(37,99,235,0.35)" : "none",
      }}>
        {/* Thumb */}
        <span style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: isDark ? "#fff" : "rgba(37,99,235,0.5)",
          transform: isDark ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.3s cubic-bezier(.22,1,.36,1), background 0.3s",
          display: "block",
          flexShrink: 0,
          boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
        }} />
      </span>
    </button>
  );
}
