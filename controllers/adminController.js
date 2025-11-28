const User = require('../models/User');
const telegramService = require('../services/telegramService');
const { checkAccess } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

class AdminController {
  async handleUserManagement(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have permission to access this section.',
          show_alert: true,
        });
        return;
      }

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'User Management:\n\nChoose an option:',
        telegramService.createUserManagementKeyboard()
      );
    } catch (error) {
      logger.error('Error handling user management:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async handleAddUser(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have permission.',
          show_alert: true,
        });
        return;
      }

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'To add a user, please send their Telegram user ID.\n\nYou can get a user ID by forwarding a message from them to @userinfobot or using other Telegram bots.'
      );
    } catch (error) {
      logger.error('Error handling add user:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async handleRemoveUser(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have permission.',
          show_alert: true,
        });
        return;
      }

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'To remove a user, please send their Telegram user ID.'
      );
    } catch (error) {
      logger.error('Error handling remove user:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async handleListUsers(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have permission.',
          show_alert: true,
        });
        return;
      }

      const users = await User.getAllUsers();
      
      if (users.length === 0) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id);
        await telegramService.sendMessage(chatId, 'No users found.');
        return;
      }

      let message = 'Users List:\n\n';
      users.forEach((user, index) => {
        message += `${index + 1}. ID: ${user.telegram_id}\n`;
        message += `   Status: ${user.is_active ? 'Active' : 'Inactive'}\n`;
        message += `   Admin: ${user.is_admin ? 'Yes' : 'No'}\n`;
        message += `   Created: ${new Date(user.created_at).toLocaleDateString()}\n\n`;
      });

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        message,
        telegramService.createUserManagementKeyboard()
      );
    } catch (error) {
      logger.error('Error listing users:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async handleBackToMain(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have permission.',
          show_alert: true,
        });
        return;
      }

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'Main Menu:',
        telegramService.createAdminKeyboard()
      );
    } catch (error) {
      logger.error('Error handling back to main:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async handleStartGeneration(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.hasAccess) {
        await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You do not have access.',
          show_alert: true,
        });
        return;
      }

      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'Send me a prompt to generate an image, or send an image with a prompt to edit it.'
      );
    } catch (error) {
      logger.error('Error handling start generation:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  }

  async processAddUser(chatId, telegramId, text) {
    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.sendMessage(chatId, 'You do not have permission to add users.');
        return;
      }

      const userIdToAdd = text.trim();
      
      if (!/^\d+$/.test(userIdToAdd)) {
        await telegramService.sendMessage(
          chatId,
          'Invalid user ID format. Please send a numeric Telegram user ID.'
        );
        return;
      }

      let user = await User.findByTelegramId(userIdToAdd);
      if (user) {
        await User.updateStatus(userIdToAdd, true);
        await telegramService.sendMessage(
          chatId,
          `User ${userIdToAdd} already exists and has been activated.`,
          telegramService.createUserManagementKeyboard()
        );
      } else {
        await User.create(userIdToAdd, false);
        await telegramService.sendMessage(
          chatId,
          `User ${userIdToAdd} has been added successfully.`,
          telegramService.createUserManagementKeyboard()
        );
      }
    } catch (error) {
      logger.error('Error processing add user:', error);
      await telegramService.sendMessage(
        chatId,
        'An error occurred while adding the user. Please try again.'
      );
    }
  }

  async processRemoveUser(chatId, telegramId, text) {
    try {
      const access = await checkAccess(telegramId);
      
      if (!access.isRootAdmin) {
        await telegramService.sendMessage(chatId, 'You do not have permission to remove users.');
        return;
      }

      const userIdToRemove = text.trim();
      
      if (!/^\d+$/.test(userIdToRemove)) {
        await telegramService.sendMessage(
          chatId,
          'Invalid user ID format. Please send a numeric Telegram user ID.'
        );
        return;
      }

      // Prevent removing root admins
      const isRootAdmin = await User.isRootAdmin(userIdToRemove);
      if (isRootAdmin) {
        await telegramService.sendMessage(
          chatId,
          'Cannot remove root admin users.',
          telegramService.createUserManagementKeyboard()
        );
        return;
      }

      const user = await User.findByTelegramId(userIdToRemove);
      if (!user) {
        await telegramService.sendMessage(
          chatId,
          `User ${userIdToRemove} not found.`,
          telegramService.createUserManagementKeyboard()
        );
        return;
      }

      await User.updateStatus(userIdToRemove, false);
      await telegramService.sendMessage(
        chatId,
        `User ${userIdToRemove} has been removed (deactivated) successfully.`,
        telegramService.createUserManagementKeyboard()
      );
    } catch (error) {
      logger.error('Error processing remove user:', error);
      await telegramService.sendMessage(
        chatId,
        'An error occurred while removing the user. Please try again.'
      );
    }
  }
}

module.exports = new AdminController();

