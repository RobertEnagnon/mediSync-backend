// backend/src/controllers/InvoiceController.ts
import { Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import notificationService from '../services/NotificationService';

export class InvoiceController {
  private invoiceService = new InvoiceService();

  public createInvoice = async (req: Request, res: Response) => {
    try {
      const invoice = await this.invoiceService.createInvoice(req.body);

      // Envoyer une notification de nouvelle facture
      await notificationService.createInvoiceNotification(invoice);

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  };

  public getAllInvoices = async (req: Request, res: Response) => {
    try {
      const invoices = await this.invoiceService.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  };

  public getInvoiceById = async (req: Request, res: Response) => {
    try {
      const invoice = await this.invoiceService.getInvoiceById(req.params.id);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  };

  public generatePDF = async (req: Request, res: Response) => {
    try {
      const pdfBuffer = await this.invoiceService.generatePDF(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  };

  public updateStatus = async (req: Request, res: Response) => {
    try {
      const invoice = await this.invoiceService.updateStatus(req.params.id, req.body.status);

      // Envoyer une notification selon le statut
      if (req.body.status === 'paid') {
        await notificationService.createAndSend({
          userId: typeof invoice.clientId === 'string' ? invoice.clientId : invoice.clientId._id,
          type: 'INVOICE_PAID',
          title: 'Facture payée',
          message: `La facture ${invoice.invoiceNumber} a été marquée comme payée`,
          data: {
            invoiceId: invoice._id,
            number: invoice.invoiceNumber,
            amount: invoice.total
          },
          severity: 'success'
        });
      } else if (req.body.status === 'overdue') {
        await notificationService.createAndSend({
          userId: typeof invoice.clientId === 'string' ? invoice.clientId : invoice.clientId._id,
          type: 'INVOICE_OVERDUE',
          title: 'Facture en retard',
          message: `La facture ${invoice.invoiceNumber} est en retard de paiement`,
          data: {
            invoiceId: invoice._id,
            number: invoice.invoiceNumber,
            amount: invoice.total
          },
          severity: 'error'
        });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update invoice status' });
    }
  };
}