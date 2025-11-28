const pool = require('../config/database');
const logger = require('../utils/logger');

class Session {
  static async findByTelegramId(telegramId) {
    try {
      const result = await pool.query(
        'SELECT * FROM sessions WHERE telegram_id = $1 AND session_active = true ORDER BY created_at DESC LIMIT 1',
        [telegramId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding session by telegram ID:', error);
      throw error;
    }
  }

  static async create(telegramId, userId) {
    try {
      // Deactivate any existing active sessions
      await pool.query(
        'UPDATE sessions SET session_active = false, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $1 AND session_active = true',
        [telegramId]
      );

      const result = await pool.query(
        'INSERT INTO sessions (user_id, telegram_id, session_active) VALUES ($1, $2, true) RETURNING *',
        [userId, telegramId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  static async updateLastImage(telegramId, imageUrl, imageBase64) {
    try {
      const result = await pool.query(
        `UPDATE sessions 
         SET last_image_url = $1, last_image_base64 = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE telegram_id = $3 AND session_active = true 
         RETURNING *`,
        [imageUrl, imageBase64, telegramId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating session last image:', error);
      throw error;
    }
  }

  static async cancel(telegramId) {
    try {
      const result = await pool.query(
        'UPDATE sessions SET session_active = false, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $1 AND session_active = true RETURNING *',
        [telegramId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error canceling session:', error);
      throw error;
    }
  }
}

module.exports = Session;

