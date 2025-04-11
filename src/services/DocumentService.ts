import { BaseService } from './BaseService';
import Document, { IDocument } from '../models/Document';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

const unlinkAsync = promisify(unlink);

export class DocumentService extends BaseService<IDocument> {
  private uploadDir: string;

  constructor() {
    super(Document);
    this.uploadDir = join(process.cwd(), 'uploads');
  }

  /**
   * Récupérer tous les documents
   */
  async getAllDocuments(): Promise<IDocument[]> {
    return this.model
      .find()
      .populate('clientId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  /**
   * Télécharger un nouveau document
   */
  async uploadDocument(
    file: Express.Multer.File,
    metadata: {
      title: string;
      clientId: string;
      practitionerId: string;
      type: 'prescription' | 'medical_report' | 'test_result' | 'other';
      description?: string;
      tags?: string[];
    }
  ): Promise<IDocument> {
    const fileName = `${uuidv4()}${file.originalname}`;
    const filePath = join(this.uploadDir, fileName);
    // Créer le flux d'écriture
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      const readStream = createReadStream(file.path);
      
      readStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Supprimer le fichier temporaire
    try {
      await unlinkAsync(file.path);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier temporaire:', error);
    }

    // Créer l'entrée dans la base de données
    return this.create({
      title: metadata.title,
      clientId: new Types.ObjectId(metadata.clientId),
      practitionerId: new Types.ObjectId(metadata.practitionerId),
      type: metadata.type,
      description: metadata.description,
      tags: metadata.tags,
      fileName: fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath
    });
  }

  /**
   * Récupérer les documents d'un client
   */
  async getDocuments(clientId: string): Promise<IDocument[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new ApiError(400, 'ID client invalide');
    }

    return this.model
      .find({ clientId: new Types.ObjectId(clientId) })
      .sort({ createdAt: -1 });
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'ID document invalide');
    }

    const document = await this.model.findById(id);
    
    if (!document) {
      throw new ApiError(404, 'Document non trouvé');
    }

    // Supprimer le fichier physique
    try {
      await unlinkAsync(document.path);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Supprimer l'entrée de la base de données
    await document.deleteOne();
  }

  /**
   * Récupérer un document pour le téléchargement
   */
  async getDocumentForDownload(id: string): Promise<{
    filePath: string;
    fileName: string;
    mimeType: string;
  }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'ID document invalide');
    }

    const document = await this.model.findById(id);
    
    if (!document) {
      throw new ApiError(404, 'Document non trouvé');
    }

    return {
      filePath: document.path,
      fileName: document.originalName,
      mimeType: document.mimeType
    };
  }
}

export default new DocumentService();
