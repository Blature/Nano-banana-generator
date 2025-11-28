const pool = require('../config/database');
const logger = require('../utils/logger');

async function createTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        telegram_id BIGINT NOT NULL,
        last_image_url TEXT,
        last_image_base64 TEXT,
        session_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Interactions table (for history)
    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        telegram_id BIGINT NOT NULL,
        session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
        interaction_type VARCHAR(50) NOT NULL,
        prompt TEXT,
        image_url TEXT,
        image_base64 TEXT,
        response_url TEXT,
        response_base64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    logger.info('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize root admins
async function initializeRootAdmins() {
  const config = require('../config/config');
  const client = await pool.connect();

  try {
    for (const adminId of config.rootAdmins) {
      await client.query(`
        INSERT INTO users (telegram_id, is_active, is_admin)
        VALUES ($1, true, true)
        ON CONFLICT (telegram_id) 
        DO UPDATE SET is_admin = true, is_active = true
      `, [adminId]);
    }
    logger.info('Root admins initialized');
  } catch (error) {
    logger.error('Error initializing root admins:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTables,
  initializeRootAdmins,
};

