import { BaseService } from './BaseService';
import Invoice, { IInvoice } from '../models/Invoice';
import { IClient } from '../models/Client';
import { IAppointment } from '../models/Appointment';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { createWriteStream } from 'fs';
import { ApiError } from '../middleware/errorHandler';

export class InvoiceService extends BaseService<IInvoice> {
  constructor() {
    super(Invoice);
  }

  /**
   * Créer une nouvelle facture
   */
  async createInvoice(data: {
    clientId: string;
    appointmentId: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<IInvoice> {
    // Calculer le total
    const total = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Créer la facture
    const invoice = await this.create({
      ...data,
      total,
      status: 'pending',
      invoiceNumber: await this.generateInvoiceNumber()
    });

    return invoice;
  }

  /**
   * Générer un numéro de facture unique
   */
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Compter les factures du mois
    const count = await this.model.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });

    // Format: YYYYMM-XXX (où XXX est un numéro séquentiel)
    return `${year}${month}-${(count + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Générer le PDF de la facture
   */
  async generatePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.model.findById(invoiceId)
      .populate<{ clientId: IClient }>('clientId', 'firstName lastName email address phone')
      .populate<{ appointmentId: IAppointment }>('appointmentId', 'date type');

    if (!invoice) {
      throw new ApiError(404, 'Facture non trouvée');
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Numéro de facture: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${format(invoice.createdAt, 'dd MMMM yyyy', { locale: fr })}`);
      doc.moveDown();

      // Informations client
      const client = invoice.clientId as IClient;
      doc.text('Client:');
      doc.text(`${client.firstName} ${client.lastName}`);
      doc.text(client.address || '');
      doc.text(`Tél: ${client.phone}`);
      doc.text(`Email: ${client.email}`);
      doc.moveDown();

      // Détails du rendez-vous
      const appointment = invoice.appointmentId as IAppointment;
      if (appointment) {
        doc.text('Rendez-vous:');
        doc.text(`Date: ${format(appointment.date, 'dd MMMM yyyy HH:mm', { locale: fr })}`);
        doc.text(`Type: ${appointment.type}`);
        doc.moveDown();
      }

      // Tableau des prestations
      doc.text('Détail des prestations:');
      let y = doc.y + 20;

      // En-têtes du tableau
      doc.text('Description', 50, y);
      doc.text('Quantité', 300, y);
      doc.text('Prix unitaire', 400, y);
      doc.text('Total', 500, y);
      y += 20;

      // Lignes du tableau
      invoice.items.forEach(item => {
        doc.text(item.description, 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`${item.unitPrice.toFixed(2)} €`, 400, y);
        doc.text(`${(item.quantity * item.unitPrice).toFixed(2)} €`, 500, y);
        y += 20;
      });

      // Total
      y += 20;
      doc.text('Total:', 400, y);
      doc.text(`${invoice.total.toFixed(2)} €`, 500, y);

      // Pied de page
      doc.moveDown(2);
      doc.fontSize(10);
      doc.text('Merci de votre confiance', { align: 'center' });
      doc.text('Pour toute question, n\'hésitez pas à nous contacter', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Mettre à jour le statut d'une facture
   */
  async updateStatus(invoiceId: string, status: 'pending' | 'paid' | 'cancelled'): Promise<IInvoice> {
    const invoice = await this.model.findByIdAndUpdate(
      invoiceId,
      { status, 
        paidAt: status === 'paid' ? new Date() : undefined 
      },
      { new: true }
    );

    if (!invoice) {
      throw new ApiError(404, 'Facture non trouvée');
    }

    return invoice;
  }

  /**
   * Obtenir toutes les factures
   */
  async getAllInvoices(): Promise<IInvoice[]> {
    return this.model.find()
      .populate<{ clientId: IClient }>('clientId', 'firstName lastName email')
      .populate<{ appointmentId: IAppointment }>('appointmentId', 'date type')
      .sort({ createdAt: -1 });
  }

  /**
   * Obtenir une facture par son ID
   */
  async getInvoiceById(id: string): Promise<IInvoice> {
    const invoice = await this.model.findById(id)
      .populate<{ clientId: IClient }>('clientId', 'firstName lastName email address phone')
      .populate<{ appointmentId: IAppointment }>('appointmentId', 'date type');

    if (!invoice) {
      throw new ApiError(404, 'Facture non trouvée');
    }

    return invoice;
  }

  /**
   * Obtenir le résumé des revenus
   */
  async getRevenueSummary(): Promise<{
    currentMonth: number;
    previousMonth: number;
    growth: number;
    byStatus: Record<string, number>;
  }> {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const [currentMonthInvoices, previousMonthInvoices] = await Promise.all([
      this.model.find({
        createdAt: {
          $gte: currentMonthStart,
          $lte: currentMonthEnd
        }
      }),
      this.model.find({
        createdAt: {
          $gte: previousMonthStart,
          $lte: previousMonthEnd
        }
      })
    ]);

    const currentMonthTotal = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const previousMonthTotal = previousMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    const growth = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    const byStatus = currentMonthInvoices.reduce((acc: Record<string, number>, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + invoice.total;
      return acc;
    }, {});

    return {
      currentMonth: Math.round(currentMonthTotal * 100) / 100,
      previousMonth: Math.round(previousMonthTotal * 100) / 100,
      growth: Math.round(growth * 100) / 100,
      byStatus
    };
  }
}

export default new InvoiceService();
