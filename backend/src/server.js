import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic test/status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API is running and connected to MongoDB',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes du Service Utilisateurs
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Middleware global de gestion des erreurs (ex. erreurs Multer)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

// Port configuration
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
