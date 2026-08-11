import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler.middleware';
import { ApiError } from './utils/apiError';
import { ApiResponse } from './utils/apiResponse';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  return ApiResponse.success(res, 200, 'Fundsroom ERP Backend API is operational', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(res, 200, 'Welcome to Fundsroom ERP/CRM Backend API v1');
});

// API Routes (v1)
app.use('/api/v1', routes);

// 404 Unhandled Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// Central Error Handler
app.use(errorHandler);

export default app;
