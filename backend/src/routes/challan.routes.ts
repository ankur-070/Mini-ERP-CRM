import { Router } from 'express';
import { ChallanController } from '../controllers/challan.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createChallanSchema } from '../validators/challan.validator';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Admin', 'Sales'),
  validate(createChallanSchema),
  ChallanController.createChallan
);

router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  ChallanController.getChallans
);

router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  ChallanController.getChallanById
);

router.post(
  '/:id/confirm',
  authorizeRoles('Admin', 'Sales'),
  ChallanController.confirmChallan
);

router.post(
  '/:id/cancel',
  authorizeRoles('Admin', 'Sales'),
  ChallanController.cancelChallan
);

export default router;
