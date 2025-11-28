const pool = require('../config/database');
const logger = require('../utils/logger');

class User {
  static async findByTelegramId(telegramId) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by telegram ID:', error);
      throw error;
    }
  }

  static async create(telegramId, isAdmin = false) {
    try {
      const result = await pool.query(
        'INSERT INTO users (telegram_id, is_active, is_admin) VALUES ($1, true, $2) RETURNING *',
        [telegramId, isAdmin]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateStatus(telegramId, isActive) {
    try {
      const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $2 RETURNING *',
        [isActive, telegramId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const result = await pool.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  static async isRootAdmin(telegramId) {
    const config = require('../config/config');
    return config.rootAdmins.includes(telegramId.toString());
  }

  static async isAdmin(telegramId) {
    try {
      const user = await this.findByTelegramId(telegramId);
      return user ? user.is_admin : false;
    } catch (error) {
      logger.error('Error checking admin status:', error);
      return false;
    }
  }

  static async hasAccess(telegramId) {
    try {
      const user = await this.findByTelegramId(telegramId);
      if (!user) return false;
      return user.is_active;
    } catch (error) {
      logger.error('Error checking user access:', error);
      return false;
    }
  }
}

module.exports = User;

