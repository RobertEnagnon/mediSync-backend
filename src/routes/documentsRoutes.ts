// backend/src/routes/documents.routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import documentController from '../controllers/DocumentController';
import type { RequestWithFile } from '../controllers/DocumentController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Liste des types MIME autorisés
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Routes pour les documents
router.use(protect);

// Route pour télécharger un document
router.post('/upload', upload.single('file'), (req, res) => {
  documentController.uploadDocument(req as RequestWithFile, res);
});

// Route pour obtenir les documents d'un client
router.get('/client/:clientId', (req, res) => {
  // Transférer le paramètre clientId vers la query string
  req.query.clientId = req.params.clientId;
  documentController.getDocuments(req, res);
});

// Route pour télécharger un document
router.get('/:id/download', documentController.downloadDocument);

// Route pour supprimer un document
router.delete('/:id', documentController.deleteDocument);

export default router;