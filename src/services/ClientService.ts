import { BaseService } from './BaseService';
import Client, { IClient } from '../models/Client';
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

/**
 * Service pour la gestion des clients
 */
export class ClientService extends BaseService<IClient> {
  constructor() {
    super(Client);
  }

  /**
   * Créer un nouveau client
   * @param data Les données du client à créer
   * @returns Le client créé
   */
  async create(data: Partial<IClient>): Promise<IClient> {
    // Vérifier si l'email existe déjà
    const existingClient = await this.model.findOne({ email: data.email });
    if (existingClient) {
      throw new ApiError(400, 'Un client avec cet email existe déjà');
    }

    return super.create({
      ...data,
      lastVisit: undefined,
      isArchived: false,
      archivedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Trouver un client par son ID
   * @param id L'ID du client
   * @returns Le client trouvé ou null
   */
  async findById(id: string): Promise<IClient | null> {
    const client = await this.model.findById(id);
    if (!client) {
      throw new ApiError(404, 'Client non trouvé');
    }
    return client;
  }

  /**
   * Mettre à jour un client
   * @param id L'ID du client
   * @param data Les données à mettre à jour
   * @returns Le client mis à jour
   */
  async update(id: string, data: Partial<IClient>): Promise<IClient | null> {
    // Vérifier si l'email existe déjà pour un autre client
    if (data.email) {
      const existingClient = await this.model.findOne({ 
        email: data.email,
        _id: { $ne: id }
      });
      if (existingClient) {
        throw new ApiError(400, 'Un client avec cet email existe déjà');
      }
    }

    return super.update(id, {
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Supprimer un client grace a son id et par sont practitionner
   * @param id L'ID du client
   * @param practitionerId L'ID du practitionner
   * @return le client supprimé
   */
  async deleteClient(id: string, practitionerId: Types.ObjectId): Promise<any> {
    const result = await Client.findOneAndDelete({
            _id: id,
            practitionerId
          });
    return result;
  }

  /**
   * Mettre à jour la date de dernière visite
   * @param clientId L'ID du client
   * @returns Le client mis à jour
   */
  async updateLastVisit(clientId: string): Promise<IClient | null> {
    const client = await this.findById(clientId);
    if (!client) {
      throw new ApiError(404, 'Client non trouvé');
    }

    return this.model.findByIdAndUpdate(
      clientId,
      { 
        lastVisit: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  /**
   * Rechercher des clients
   * @param query Le terme de recherche
   * @returns Liste des clients correspondants
   */
  async search(query: string, practitionerId: Types.ObjectId): Promise<IClient[]> {
    // const searchRegex = new RegExp(query, 'i');
    return this.model.find({
      isArchived: false,
      practitionerId,
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).sort({ lastName: 1, firstName: 1 });
  }

  /**
   * Obtenir les clients par plage de dates
   * @param startDate Date de début
   * @param endDate Date de fin
   * @returns Liste des clients
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<IClient[]> {
    return this.model.find({
      isArchived: false,
      createdAt: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate)
      }
    }).sort({ createdAt: -1 });
  }

  /**
   * Trouver les clients dont c'est bientôt l'anniversaire
   * @param daysInAdvance Nombre de jours à l'avance
   * @returns Liste des clients
   */
  async findUpcomingBirthdays(daysInAdvance: number = 7): Promise<IClient[]> {
    const today = new Date();
    const futureDate = addDays(today, daysInAdvance);
    
    return this.model.aggregate([
      {
        $match: {
          isArchived: false,
          birthDate: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          monthDay: {
            $dateToString: { 
              format: "%m-%d", 
              date: "$birthDate" 
            }
          },
          todayMonthDay: {
            $dateToString: { 
              format: "%m-%d", 
              date: today 
            }
          },
          futureDateMonthDay: {
            $dateToString: { 
              format: "%m-%d", 
              date: futureDate 
            }
          }
        }
      },
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ["$monthDay", "$todayMonthDay"] },
              { $lte: ["$monthDay", "$futureDateMonthDay"] }
            ]
          }
        }
      },
      {
        $sort: {
          monthDay: 1
        }
      }
    ]);
  }

  
  /**
   * Trouver les clients inactifs
   * @param inactiveDate Date à partir de laquelle un client est considéré comme inactif
   * @returns Liste des clients inactifs
   */
  async findInactiveClients(inactiveDate: Date): Promise<IClient[]> {
    return this.model.find({
      isArchived: false,
      $or: [
        { lastVisit: { $lt: inactiveDate } },
        { lastVisit: undefined }
      ]
    }).sort({ lastVisit: 1 });
  }

  /**
   * Obtenir les statistiques des clients
   * @returns Statistiques des clients
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    averageVisitsPerMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = subDays(now, 90);

    const [
      totalClients,
      newClients,
      activeClients,
      totalVisits
    ] = await Promise.all([
      this.model.countDocuments({ isArchived: false }),
      this.model.countDocuments({
        isArchived: false,
        createdAt: { $gte: startOfMonth }
      }),
      this.model.countDocuments({
        isArchived: false,
        lastVisit: { $gte: threeMonthsAgo }
      }),
      this.model.aggregate([
        {
          $match: {
            isArchived: false,
            lastVisit: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 }
          }
        }
      ])
    ]);

    const visitsCount = totalVisits[0]?.totalVisits || 0;
    const monthsSinceStart = Math.max(1, Math.floor((now.getTime() - new Date(2024, 0, 1).getTime()) / (30 * 24 * 60 * 60 * 1000)));

    return {
      total: totalClients,
      active: activeClients,
      inactive: totalClients - activeClients,
      newThisMonth: newClients,
      averageVisitsPerMonth: Math.round((visitsCount / monthsSinceStart) * 100) / 100
    };
  }

  /**
   * Fusionner deux clients
   * @param sourceId ID du client source
   * @param targetId ID du client cible
   * @returns Client fusionné
   */
  async merge(sourceId: string, targetId: string): Promise<IClient> {
    const [source, target] = await Promise.all([
      this.findById(sourceId),
      this.findById(targetId)
    ]);

    if (!source || !target) {
      throw new ApiError(404, 'Un ou plusieurs clients non trouvés');
    }

    if (source.isArchived || target.isArchived) {
      throw new ApiError(400, 'Impossible de fusionner des clients archivés');
    }

    // Mettre à jour les références dans les autres collections
    await Promise.all([
      // Mettre à jour les rendez-vous
      this.model.updateMany(
        { clientId: sourceId },
        { $set: { clientId: targetId } }
      ),
      // Mettre à jour les documents
      this.model.updateMany(
        { clientId: sourceId },
        { $set: { clientId: targetId } }
      ),
      // Mettre à jour les factures
      this.model.updateMany(
        { clientId: sourceId },
        { $set: { clientId: targetId } }
      )
    ]);

    // Archiver le client source au lieu de le supprimer
    await this.archive(sourceId);

    // Retourner le client cible mis à jour
    return this.findById(targetId) as Promise<IClient>;
  }

  /**
   * Archiver un client
   * @param id ID du client
   * @returns Client archivé
   */
  async archive(id: string): Promise<IClient | null> {
    const client = await this.findById(id);
    if (!client) {
      throw new ApiError(404, 'Client non trouvé');
    }

    if (client.isArchived) {
      throw new ApiError(400, 'Le client est déjà archivé');
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  /**
   * Désarchiver un client
   * @param id ID du client
   * @returns Client désarchivé
   */
  async unarchive(id: string): Promise<IClient | null> {
    const client = await this.findById(id);
    if (!client) {
      throw new ApiError(404, 'Client non trouvé');
    }

    if (!client.isArchived) {
      throw new ApiError(400, 'Le client n\'est pas archivé');
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        isArchived: false,
        archivedAt: undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
  }
}

export default new ClientService();
