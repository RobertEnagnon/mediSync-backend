// backend/src/controllers/DocumentController.ts
import { Request, Response } from 'express';
import { DocumentService } from '../services/DocumentService';
import { ApiError } from '../middleware/errorHandler';

// Définition du type pour la requête avec fichier
export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  public getAllDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await this.documentService.getAllDocuments();
      res.json(documents);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
      }
    }
  };

  public uploadDocument = async (req: RequestWithFile, res: Response) => {
    try {
      if (!req.file) {
        throw new ApiError(400, 'Aucun fichier n\'a été téléchargé');
      }

      // Parse les données JSON du formulaire
      let documentData;
      try {
        documentData = JSON.parse(req.body.data);
      } catch (error) {
        throw new ApiError(400, 'Les données du document sont invalides');
      }

      // Validation des champs requis
      if (!documentData.title || !documentData.type || !documentData.clientId || !documentData.practitionerId) {
        throw new ApiError(400, 'Champs obligatoires manquants');
      }

      const document = await this.documentService.uploadDocument(req.file, documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        console.error('Erreur lors du téléchargement:', error);
        res.status(500).json({ error: 'Erreur lors du téléchargement du document: ' + error });
      }
    }
  };

  public getDocuments = async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;
      
      if (!clientId || typeof clientId !== 'string') {
        throw new ApiError(400, 'L\'ID du client est requis');
      }

      const documents = await this.documentService.getDocuments(clientId);
      res.json(documents);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
      }
    }
  };

  public deleteDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.documentService.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur lors de la suppression du document' });
      }
    }
  };

  public downloadDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { filePath, fileName, mimeType } = await this.documentService.getDocumentForDownload(id);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur lors du téléchargement du document' });
      }
    }
  };
}

export default new DocumentController();