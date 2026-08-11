import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerUserSchema } from '../validators/auth.validator';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/register', authenticateJWT, authorizeRoles('Admin'), validate(registerUserSchema), AuthController.register);
router.get('/me', authenticateJWT, AuthController.getProfile);

export default router;
