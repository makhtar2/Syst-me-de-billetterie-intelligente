import {
  isValidEmail,
  isValidCreateUserForm,
  validateLoginForm,
  validateNewPassword,
} from './validators';

describe('isValidEmail', () => {
  test('accepte une adresse email correcte', () => {
    expect(isValidEmail('jean.dupont@entreprise.com')).toBe(true);
  });

  test('refuse une adresse sans @', () => {
    expect(isValidEmail('jean.dupont-entreprise.com')).toBe(false);
  });

  test('refuse une valeur vide', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidCreateUserForm', () => {
  test('valide quand tous les champs requis sont renseignés', () => {
    expect(
      isValidCreateUserForm({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@entreprise.com',
        telephone: '+221771234567',
      })
    ).toBe(true);
  });

  test('invalide si un champ requis est manquant', () => {
    expect(
      isValidCreateUserForm({ nom: 'Dupont', prenom: '', email: 'x@x.com', telephone: '123' })
    ).toBe(false);
  });

  test('invalide si aucun champ fourni', () => {
    expect(isValidCreateUserForm()).toBe(false);
  });
});

describe('validateLoginForm', () => {
  test("retourne une erreur si l'email est vide", () => {
    expect(validateLoginForm({ email: '', password: 'secret123' })).toMatch(/email/i);
  });

  test('retourne une erreur si le mot de passe fait moins de 6 caractères', () => {
    expect(validateLoginForm({ email: 'a@b.com', password: '123' })).toMatch(/6 caractères/i);
  });

  test('retourne null quand email et mot de passe sont valides', () => {
    expect(validateLoginForm({ email: 'a@b.com', password: 'secret123' })).toBeNull();
  });
});

describe('validateNewPassword', () => {
  test('retourne une erreur si le mot de passe est trop court', () => {
    expect(validateNewPassword('short1', 'short1')).toMatch(/8 caractères/i);
  });

  test('retourne une erreur si les deux mots de passe ne correspondent pas', () => {
    expect(validateNewPassword('longenough1', 'longenough2')).toMatch(/ne correspondent pas/i);
  });

  test('retourne null quand le mot de passe est valide et confirmé', () => {
    expect(validateNewPassword('longenough1', 'longenough1')).toBeNull();
  });
});
