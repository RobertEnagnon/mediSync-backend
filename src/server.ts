import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import noteRoutes from "./routes/noteRoutes";
import appointmentRoutes from './routes/appointmentRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import documentsRoutes from './routes/documentsRoutes';
import invoicesRoutes from './routes/invoicesRoutes';
import notificationRoutes from './routes/notificationRoutes';
import eventRoutes from './routes/eventRoutes';
import dashboardRoutes from "./routes/dashboardRoutes";
import statisticRoutes from "./routes/statisticsRoutes";
import metricsRoutes from "./routes/metricsRoutes";

// WebSocket
import initializeWebSocket from './config/websocket.config';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { protect } from './middleware/auth';

// Configuration
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware de base
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier statique pour les uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/clients', protect, clientRoutes);
app.use('/api/notes', protect, noteRoutes);
app.use('/api/appointments', protect, appointmentRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/documents', protect, documentsRoutes);
app.use('/api/invoices', protect, invoicesRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/events', protect, eventRoutes);
app.use('/api/statistics', protect, statisticRoutes);
app.use('/api/metrics', protect, metricsRoutes);

// Middleware de gestion des erreurs
app.use(errorHandler);

// Configuration WebSocket
const io = initializeWebSocket(server);

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medisync';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB');
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log('Initialisation des tâches planifiées...');
      // Le service est déjà initialisé grâce au singleton
      // Les tâches planifiées démarreront automatiquement
    });
  })
  .catch((error) => {
    console.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  });

export { app, server, io };
