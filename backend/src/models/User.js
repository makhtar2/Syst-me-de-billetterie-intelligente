import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'adresse email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Veuillez entrer un email valide'],
    },
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['Administrateur', 'Agent', 'Client'],
      default: 'Client',
    },
    status: {
      type: String,
      enum: ['Actif', 'Bloqué', 'Supprimé'],
      // Les comptes créés attendent l'activation pour passer à 'Actif'
      default: 'Bloqué',
    },
    photo: {
      type: String, // URL ou chemin de l'image de profil
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
    },
    mustChangePassword: {
      type: Boolean,
      // Force le changement au premier login si créé/activé par l'admin
      default: false,
    },
  },
  {
    timestamps: true, // Génère createdAt et updatedAt
  }
);

// Hachage du mot de passe avant chaque sauvegarde (si modifié)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Comparaison du mot de passe fourni avec le hash stocké
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Champ "date" (date de création formatée AAAA-MM-JJ) attendu par le front
UserSchema.virtual('date').get(function () {
  return this.createdAt ? this.createdAt.toISOString().split('T')[0] : '';
});

// Sérialisation JSON : inclut les virtuals (id, date) et masque le mot de passe
UserSchema.set('toJSON', {
  virtuals: true, // expose "id" (string) et "date" en plus de "_id"
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', UserSchema);
