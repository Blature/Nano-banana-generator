const telegramService = require('../services/telegramService');
const botController = require('../controllers/botController');
const adminController = require('../controllers/adminController');
const { checkAccess } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Track admin action states
const adminStates = new Map();

function setupBotRoutes() {
  const bot = telegramService.getBot();

  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    botController.handleStart(msg);
  });

  // Handle callback queries (button clicks)
  bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      switch (data) {
        case 'cancel_session':
          await botController.handleCancelSession(callbackQuery);
          break;
        case 'user_management':
          await adminController.handleUserManagement(callbackQuery);
          break;
        case 'add_user':
          adminStates.set(chatId, 'waiting_for_add_user');
          await adminController.handleAddUser(callbackQuery);
          break;
        case 'remove_user':
          adminStates.set(chatId, 'waiting_for_remove_user');
          await adminController.handleRemoveUser(callbackQuery);
          break;
        case 'list_users':
          await adminController.handleListUsers(callbackQuery);
          break;
        case 'back_to_main':
          adminStates.delete(chatId);
          await adminController.handleBackToMain(callbackQuery);
          break;
        case 'start_generation':
          await adminController.handleStartGeneration(callbackQuery);
          break;
        default:
          await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      logger.error('Error handling callback query:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred',
        show_alert: true,
      });
    }
  });

  // Handle text messages
  bot.on('message', async (msg) => {
    // Skip if it's a command
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();

    // Check if admin is in a special state
    const adminState = adminStates.get(chatId);
    
    if (adminState === 'waiting_for_add_user' && msg.text) {
      adminStates.delete(chatId);
      await adminController.processAddUser(chatId, telegramId, msg.text);
      return;
    }

    if (adminState === 'waiting_for_remove_user' && msg.text) {
      adminStates.delete(chatId);
      await adminController.processRemoveUser(chatId, telegramId, msg.text);
      return;
    }

    // Handle photo messages
    if (msg.photo) {
      await botController.handlePhotoMessage(msg);
      return;
    }

    // Handle text messages (prompts)
    if (msg.text) {
      await botController.handleTextMessage(msg);
      return;
    }
  });

  logger.info('Bot routes initialized');
}

module.exports = setupBotRoutes;

