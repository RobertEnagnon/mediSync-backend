// backend/src/routes/invoices.routes.ts
import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';

const router = Router();
const controller = new InvoiceController();

router.post('/', controller.createInvoice);
router.get('/', controller.getAllInvoices);
router.get('/:id', controller.getInvoiceById);
router.get('/:id/pdf', controller.generatePDF);
router.put('/:id/status', controller.updateStatus);

export default router;