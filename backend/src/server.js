const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('Database connected.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`School MS API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
