import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Email invalide'],
    },
    telephone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['Administrateur', 'Agent', 'Client'],
      default: 'Client',
    },
    status: {
      type: String,
      enum: ['Actif', 'Bloqué', 'Supprimé'],
      default: 'Bloqué',
    },
    photo: { type: String, default: '' },
    password: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

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

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
