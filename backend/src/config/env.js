require('dotenv').config();

const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173', // 👈 เพิ่มค่า Default สำหรับ Frontend URL
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    // 💧 Turbo: Explicit Pool Configuration
    pool: {
      max: 50, // Increase max connections for parallel queries
      min: 5,  // Keep some connections open
      idleTimeoutMillis: 30000
    }
  },
  jwtSecret: process.env.JWT_SECRET || 'secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
};

// Simple validation
if (!config.db.user || !config.db.server || !config.db.database) {
  console.warn('⚠️  Warning: Some database environment variables are missing!');
}

module.exports = config;
