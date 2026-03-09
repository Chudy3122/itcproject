import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', orderController.getAll.bind(orderController));
router.get('/:id', orderController.getById.bind(orderController));
router.post('/', orderController.create.bind(orderController));
router.put('/:id', orderController.update.bind(orderController));
router.patch('/:id/status', orderController.updateStatus.bind(orderController));
router.delete('/:id', orderController.delete.bind(orderController));

export default router;
