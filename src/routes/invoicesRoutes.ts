// backend/src/routes/invoices.routes.ts
import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';

const router = Router();
const controller = new InvoiceController();

// Routes de base des factures
router.post('/', controller.createInvoice);
router.get('/', controller.getAllInvoices);
router.get('/:id', controller.getInvoiceById);
router.get('/:id/pdf', controller.generatePDF);
router.put('/:id/status', controller.updateStatus);

// Routes pour les actions spécifiques sur les factures
router.post('/:id/pay', controller.markAsPaid);
router.post('/:id/cancel', controller.cancelInvoice);

export default router;