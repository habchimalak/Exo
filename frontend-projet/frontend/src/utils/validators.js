/**
 * Utilitaires de validation de formulaires — ExoCraft
 */

// ── Email ────────────────────────────────────────────────────────────────────
export function validateEmail(email) {
  if (!email?.trim()) return "L'adresse email est obligatoire.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return "L'adresse email n'est pas valide.";
  return null;
}

// ── Mot de passe ─────────────────────────────────────────────────────────────
export function validatePassword(password) {
  if (!password) return "Le mot de passe est obligatoire.";
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (password.length > 128) return "Le mot de passe est trop long (128 caractères max).";
  return null;
}

export function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8)      errors.push("8 caractères minimum");
  if (!/[A-Z]/.test(password))  errors.push("1 majuscule");
  if (!/[0-9]/.test(password))  errors.push("1 chiffre");
  return errors; // tableau vide = mot de passe fort
}

// ── Nom / Prénom ─────────────────────────────────────────────────────────────
export function validateName(value, label = "Ce champ") {
  if (!value?.trim()) return `${label} est obligatoire.`;
  if (value.trim().length < 2)  return `${label} doit contenir au moins 2 caractères.`;
  if (value.trim().length > 60) return `${label} est trop long (60 caractères max).`;
  if (/[0-9!@#$%^&*()_+={}[\]|\\:;"<>?,./~`]/.test(value))
    return `${label} ne doit pas contenir de chiffres ou caractères spéciaux.`;
  return null;
}

// ── Champ obligatoire générique ───────────────────────────────────────────────
export function validateRequired(value, label = "Ce champ") {
  if (!value?.toString().trim()) return `${label} est obligatoire.`;
  return null;
}

// ── Confirmation mot de passe ─────────────────────────────────────────────────
export function validateConfirmPassword(password, confirm) {
  if (!confirm) return "La confirmation du mot de passe est obligatoire.";
  if (password !== confirm) return "Les mots de passe ne correspondent pas.";
  return null;
}

// ── Code OTP ─────────────────────────────────────────────────────────────────
export function validateOtp(code) {
  if (!code?.trim()) return "Le code de vérification est obligatoire.";
  if (!/^\d{6}$/.test(code.trim())) return "Le code doit contenir exactement 6 chiffres.";
  return null;
}

// ── Nombre ───────────────────────────────────────────────────────────────────
export function validateNumber(value, { min, max, label = "Ce champ" } = {}) {
  const n = Number(value);
  if (isNaN(n)) return `${label} doit être un nombre.`;
  if (min !== undefined && n < min) return `${label} doit être au moins ${min}.`;
  if (max !== undefined && n > max) return `${label} doit être au maximum ${max}.`;
  return null;
}

// ── Texte (longueur) ──────────────────────────────────────────────────────────
export function validateText(value, { minLen = 1, maxLen = 500, label = "Ce champ" } = {}) {
  if (!value?.trim()) return `${label} est obligatoire.`;
  if (value.trim().length < minLen) return `${label} doit contenir au moins ${minLen} caractères.`;
  if (value.trim().length > maxLen) return `${label} est trop long (${maxLen} caractères max).`;
  return null;
}

// ── Exécuter un objet de règles et retourner les erreurs ──────────────────────
export function runValidation(rules) {
  const errors = {};
  for (const [field, error] of Object.entries(rules)) {
    if (error) errors[field] = error;
  }
  return errors; // {} si tout est OK
}
