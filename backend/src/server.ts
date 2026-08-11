import app from './app';
import { env } from './config/env';
import pool from './config/db';

const PORT = parseInt(env.PORT, 10) || 5000;

async function startServer() {
  try {
    // Verify database connectivity on startup
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connection established successfully.');
    client.release();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Fundsroom ERP Backend running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
    });

    const shutdown = async () => {
      console.log('\n⏳ Shutting down gracefully...');
      server.close(async () => {
        await pool.end();
        console.log('👋 Database pool closed. Server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
