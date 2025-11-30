const User = require('../models/User');
const Session = require('../models/Session');
const Interaction = require('../models/Interaction');
const telegramService = require('../services/telegramService');
const geminiService = require('../services/geminiService');
const { checkAccess } = require('../middleware/authMiddleware');
const GeminiErrorHandler = require('../utils/geminiErrorHandler');
const logger = require('../utils/logger');
const { Readable } = require('stream');

class BotController {
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();

    try {
      const access = await checkAccess(telegramId);
      
      if (!access.hasAccess) {
        await telegramService.sendMessage(
          chatId,
          'You do not have access to this bot.'
        );
        return;
      }

      // Ensure user exists in database
      let user = await User.findByTelegramId(telegramId);
      if (!user) {
        user = await User.create(telegramId, access.isRootAdmin);
      }

      if (access.isRootAdmin) {
        await telegramService.sendMessage(
          chatId,
          'Welcome! You are a root admin. Choose an option:',
          telegramService.createAdminKeyboard()
        );
      } else {
        await telegramService.sendMessage(
          chatId,
          'Welcome! Send me a prompt to generate an image, or send an image with a prompt to edit it.'
        );
      }
    } catch (error) {
      logger.error('Error handling /start command:', error);
      await telegramService.sendMessage(
        chatId,
        'An error occurred. Please try again later.'
      );
    }
  }

  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const text = msg.text;

    try {
      const access = await checkAccess(telegramId);
      if (!access.hasAccess) {
        await telegramService.sendMessage(
          chatId,
          'You do not have access to this bot.'
        );
        return;
      }

      // Get or create user
      let user = await User.findByTelegramId(telegramId);
      if (!user) {
        user = await User.create(telegramId, access.isRootAdmin);
      }

      // Get active session
      let session = await Session.findByTelegramId(telegramId);
      
      if (!session) {
        // Create new session for image generation
        session = await Session.create(telegramId, user.id);
        await this.generateNewImage(chatId, telegramId, user.id, session.id, text);
      } else {
        // Check if session has a previous image
        if (session.last_image_base64) {
          // Edit existing image
          await this.editImage(chatId, telegramId, user.id, session.id, text, session.last_image_base64);
        } else {
          // No previous image, treat as new generation
          // Cancel old session and create new one
          await Session.cancel(telegramId);
          session = await Session.create(telegramId, user.id);
          await this.generateNewImage(chatId, telegramId, user.id, session.id, text);
        }
      }
    } catch (error) {
      logger.error('Error handling text message:', error);
      
      // Cancel session on error
      try {
        await Session.cancel(telegramId);
      } catch (sessionError) {
        logger.error('Error canceling session:', sessionError);
      }
      
      await telegramService.sendMessage(
        chatId,
        '❌ An error occurred while processing your request.\n\n✅ Please try again.'
      );
    }
  }

  async handlePhotoMessage(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
    const caption = msg.caption; // Get caption if provided

    try {
      const access = await checkAccess(telegramId);
      if (!access.hasAccess) {
        await telegramService.sendMessage(
          chatId,
          'You do not have access to this bot.'
        );
        return;
      }

      // Get or create user
      let user = await User.findByTelegramId(telegramId);
      if (!user) {
        user = await User.create(telegramId, access.isRootAdmin);
      }

      // Download the photo
      const { file, stream } = await telegramService.downloadFile(photo.file_id);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const imageBase64 = geminiService.constructor.bufferToBase64(buffer);

      // Get or create session
      let session = await Session.findByTelegramId(telegramId);
      if (!session) {
        session = await Session.create(telegramId, user.id);
      }

      // Update session with the image
      await Session.updateLastImage(telegramId, file.file_path, imageBase64);

      // If caption (prompt) is provided, edit the image immediately
      if (caption && caption.trim()) {
        await this.editImage(chatId, telegramId, user.id, session.id, caption, imageBase64);
      } else {
        await telegramService.sendMessage(
          chatId,
          'Image received! Now send me a prompt to edit this image.'
        );
      }
    } catch (error) {
      logger.error('Error handling photo message:', error);
      await telegramService.sendMessage(
        chatId,
        'An error occurred while processing the image. Please try again.'
      );
    }
  }

  async generateNewImage(chatId, telegramId, userId, sessionId, prompt) {
    try {
      await telegramService.sendMessage(chatId, 'Generating image... Please wait.');

      const result = await geminiService.generateImage(prompt);
      
      if (result.success && (result.imageBase64 || result.imageUrl)) {
        // Send the image
        if (result.imageBase64) {
          const imageBuffer = Buffer.from(result.imageBase64, 'base64');
          await telegramService.sendPhoto(
            chatId,
            imageBuffer,
            {
              caption: `Generated image for: "${prompt}"`,
              ...telegramService.createCancelSessionKeyboard()
            }
          );
        } else if (result.imageUrl) {
          await telegramService.sendPhoto(
            chatId,
            result.imageUrl,
            {
              caption: `Generated image for: "${prompt}"`,
              ...telegramService.createCancelSessionKeyboard()
            }
          );
        }

        // Update session
        await Session.updateLastImage(telegramId, result.imageUrl, result.imageBase64);

        // Save interaction
        await Interaction.create({
          userId,
          telegramId,
          sessionId,
          interactionType: 'generate',
          prompt,
          responseUrl: result.imageUrl,
          responseBase64: result.imageBase64,
        });
      } else {
        throw new Error('Failed to generate image - no image data in response');
      }
    } catch (error) {
      logger.error('Error generating image:', error);
      
      // Cancel session on error to allow user to try again
      try {
        await Session.cancel(telegramId);
        logger.info(`Session canceled for user ${telegramId} due to error`);
      } catch (sessionError) {
        logger.error('Error canceling session:', sessionError);
      }
      
      // Get user-friendly error message from GeminiErrorHandler
      const errorMessage = GeminiErrorHandler.getUserMessage(error);
      
      // Add retry suggestion if applicable
      const shouldRetry = GeminiErrorHandler.shouldRetry(error);
      const finalMessage = errorMessage + 
        (shouldRetry ? '\n\n✅ You can try again later.' : '\n\n✅ You can send a new prompt.');
      
      await telegramService.sendMessage(chatId, finalMessage);
    }
  }

  async editImage(chatId, telegramId, userId, sessionId, prompt, imageBase64) {
    try {
      if (!imageBase64) {
        // Cancel session if no previous image found
        try {
          await Session.cancel(telegramId);
        } catch (sessionError) {
          logger.error('Error canceling session:', sessionError);
        }
        
        await telegramService.sendMessage(
          chatId,
          '❌ No previous image found.\n\n✅ Please send a new image or start a new generation by sending a prompt.'
        );
        return;
      }

      await telegramService.sendMessage(chatId, 'Editing image... Please wait.');

      const result = await geminiService.editImage(imageBase64, prompt);
      
      if (result.success && (result.imageBase64 || result.imageUrl)) {
        // Send the edited image
        if (result.imageBase64) {
          const imageBuffer = Buffer.from(result.imageBase64, 'base64');
          await telegramService.sendPhoto(
            chatId,
            imageBuffer,
            {
              caption: `Edited image with: "${prompt}"`,
              ...telegramService.createCancelSessionKeyboard()
            }
          );
        } else if (result.imageUrl) {
          await telegramService.sendPhoto(
            chatId,
            result.imageUrl,
            {
              caption: `Edited image with: "${prompt}"`,
              ...telegramService.createCancelSessionKeyboard()
            }
          );
        }

        // Update session
        await Session.updateLastImage(telegramId, result.imageUrl, result.imageBase64);

        // Save interaction
        await Interaction.create({
          userId,
          telegramId,
          sessionId,
          interactionType: 'edit',
          prompt,
          imageBase64,
          responseUrl: result.imageUrl,
          responseBase64: result.imageBase64,
        });
      } else {
        throw new Error('Failed to edit image - no image data in response');
      }
    } catch (error) {
      logger.error('Error editing image:', error);
      
      // Cancel session on error to allow user to try again
      try {
        await Session.cancel(telegramId);
        logger.info(`Session canceled for user ${telegramId} due to error`);
      } catch (sessionError) {
        logger.error('Error canceling session:', sessionError);
      }
      
      // Get user-friendly error message from GeminiErrorHandler
      const errorMessage = GeminiErrorHandler.getUserMessage(error);
      
      // Add retry suggestion if applicable
      const shouldRetry = GeminiErrorHandler.shouldRetry(error);
      const finalMessage = errorMessage + 
        (shouldRetry ? '\n\n✅ You can try again later.' : '\n\n✅ You can send a new image and prompt.');
      
      await telegramService.sendMessage(chatId, finalMessage);
    }
  }

  async handleCancelSession(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    try {
      await Session.cancel(telegramId);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id);
      await telegramService.sendMessage(
        chatId,
        'Session canceled. You can now start a new image generation or editing session.'
      );
    } catch (error) {
      logger.error('Error canceling session:', error);
      await telegramService.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Error canceling session',
        show_alert: true,
      });
    }
  }
}

module.exports = new BotController();

