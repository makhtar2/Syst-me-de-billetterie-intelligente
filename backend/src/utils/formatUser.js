export function formatUser(user) {
  return {
    id: user._id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone,
    role: user.role,
    status: user.status,
    date: user.createdAt ? user.createdAt.toISOString().split('T')[0] : '',
  };
}
