import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Admin', 'Warehouse'),
  validate(createProductSchema),
  ProductController.createProduct
);

router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  ProductController.getProducts
);

router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  ProductController.getProductById
);

router.put(
  '/:id',
  authorizeRoles('Admin', 'Warehouse'),
  validate(updateProductSchema),
  ProductController.updateProduct
);

export default router;
