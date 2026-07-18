// Règles de validation partagées par les formulaires du service Utilisateurs.
// Extraites des composants pour être testables unitairement (voir validators.test.js).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

// Champs requis pour la création d'un utilisateur (CreateUserModal)
export function isValidCreateUserForm({ nom, prenom, email, telephone } = {}) {
  return Boolean(nom && prenom && email && telephone);
}

// Règles du formulaire de connexion (Login)
export function validateLoginForm({ email, password } = {}) {
  if (!email) {
    return "Veuillez saisir votre adresse email ou votre identifiant.";
  }
  if (!password || password.length < 6) {
    return "Le mot de passe doit comporter au moins 6 caractères.";
  }
  return null;
}

// Le nouveau mot de passe doit respecter la longueur minimale et être confirmé (ProfileSettings)
export function validateNewPassword(newPassword, confirmPassword, minLength = 8) {
  if (!newPassword || newPassword.length < minLength) {
    return `Le mot de passe doit comporter au moins ${minLength} caractères.`;
  }
  if (newPassword !== confirmPassword) {
    return 'Les deux nouveaux mots de passe ne correspondent pas.';
  }
  return null;
}
