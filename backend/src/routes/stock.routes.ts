import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createStockAdjustmentSchema } from '../validators/stock.validator';

const router = Router();

router.use(authenticateJWT);

router.get(
  '/',
  authorizeRoles('Admin', 'Warehouse', 'Accounts'),
  StockController.getStockMovements
);

router.post(
  '/',
  authorizeRoles('Admin', 'Warehouse'),
  validate(createStockAdjustmentSchema),
  StockController.createManualAdjustment
);

export default router;
