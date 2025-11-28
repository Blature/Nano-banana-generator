const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const logger = require('../utils/logger');

class TelegramService {
  constructor() {
    if (!config.telegram.token) {
      throw new Error('Telegram bot token is not configured');
    }

    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', error);
    });

    this.bot.on('error', (error) => {
      logger.error('Telegram bot error:', error);
    });
  }

  getBot() {
    return this.bot;
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendPhoto(chatId, photo, options = {}) {
    try {
      return await this.bot.sendPhoto(chatId, photo, options);
    } catch (error) {
      logger.error('Error sending photo:', error);
      throw error;
    }
  }

  async sendDocument(chatId, document, options = {}) {
    try {
      return await this.bot.sendDocument(chatId, document, options);
    } catch (error) {
      logger.error('Error sending document:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      const file = await this.bot.getFile(fileId);
      const fileStream = this.bot.getFileStream(fileId);
      return { file, stream: fileStream };
    } catch (error) {
      logger.error('Error downloading file:', error);
      throw error;
    }
  }

  createCancelSessionKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cancel Session', callback_data: 'cancel_session' }]
        ]
      }
    };
  }

  createAdminKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'User Management', callback_data: 'user_management' }],
          [{ text: 'Start Image Generation', callback_data: 'start_generation' }]
        ]
      }
    };
  }

  createUserManagementKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Add User', callback_data: 'add_user' }],
          [{ text: 'Remove User', callback_data: 'remove_user' }],
          [{ text: 'List Users', callback_data: 'list_users' }],
          [{ text: 'Back to Main Menu', callback_data: 'back_to_main' }]
        ]
      }
    };
  }
}

module.exports = new TelegramService();

