const pool = require('../config/database');
const logger = require('../utils/logger');

class Interaction {
  static async create(data) {
    try {
      const {
        userId,
        telegramId,
        sessionId,
        interactionType,
        prompt,
        imageUrl,
        imageBase64,
        responseUrl,
        responseBase64,
      } = data;

      const result = await pool.query(
        `INSERT INTO interactions 
         (user_id, telegram_id, session_id, interaction_type, prompt, image_url, image_base64, response_url, response_base64)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [userId, telegramId, sessionId, interactionType, prompt, imageUrl, imageBase64, responseUrl, responseBase64]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating interaction:', error);
      throw error;
    }
  }

  static async getHistoryByUser(telegramId, limit = 10) {
    try {
      const result = await pool.query(
        'SELECT * FROM interactions WHERE telegram_id = $1 ORDER BY created_at DESC LIMIT $2',
        [telegramId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting interaction history:', error);
      throw error;
    }
  }
}

module.exports = Interaction;

