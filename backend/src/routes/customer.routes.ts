import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpNoteSchema,
} from '../validators/customer.validator';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Admin', 'Sales'),
  validate(createCustomerSchema),
  CustomerController.createCustomer
);

router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Accounts'),
  CustomerController.getCustomers
);

router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Accounts'),
  CustomerController.getCustomerById
);

router.put(
  '/:id',
  authorizeRoles('Admin', 'Sales'),
  validate(updateCustomerSchema),
  CustomerController.updateCustomer
);

router.post(
  '/:id/notes',
  authorizeRoles('Admin', 'Sales'),
  validate(addFollowUpNoteSchema),
  CustomerController.addFollowUpNote
);

export default router;
