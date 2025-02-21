
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from './config/database';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import eventRoutes from './routes/eventRoutes';
import noteRoutes from './routes/noteRoutes';
import { errorHandler } from './middleware/errorHandler';
import { protect } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/clients', protect, clientRoutes);
app.use('/api/appointments', protect, appointmentRoutes);
app.use('/api/events', protect, eventRoutes);
app.use('/api/notes', protect, noteRoutes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
