const User = require('../models/User');
const Session = require('../models/Session');
const Interaction = require('../models/Interaction');
const telegramService = require('../services/telegramService');
const geminiService = require('../services/geminiService');
const { checkAccess } = require('../middleware/authMiddleware');
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
        // Edit existing image
        await this.editImage(chatId, telegramId, user.id, session.id, text, session.last_image_base64);
      }
    } catch (error) {
      logger.error('Error handling text message:', error);
      await telegramService.sendMessage(
        chatId,
        'An error occurred while processing your request. Please try again.'
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
      
      if (result.success && result.imageBase64) {
        // Send the image
        const imageBuffer = Buffer.from(result.imageBase64, 'base64');
        await telegramService.sendPhoto(
          chatId,
          imageBuffer,
          {
            caption: `Generated image for: "${prompt}"`,
            ...telegramService.createCancelSessionKeyboard()
          }
        );

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
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      logger.error('Error generating image:', error);
      await telegramService.sendMessage(
        chatId,
        'Sorry, I encountered an error while generating the image. Please try again with a different prompt.'
      );
    }
  }

  async editImage(chatId, telegramId, userId, sessionId, prompt, imageBase64) {
    try {
      if (!imageBase64) {
        await telegramService.sendMessage(
          chatId,
          'No previous image found. Please send an image first or start a new generation.'
        );
        return;
      }

      await telegramService.sendMessage(chatId, 'Editing image... Please wait.');

      const result = await geminiService.editImage(imageBase64, prompt);
      
      if (result.success && result.imageBase64) {
        // Send the edited image
        const imageBuffer = Buffer.from(result.imageBase64, 'base64');
        await telegramService.sendPhoto(
          chatId,
          imageBuffer,
          {
            caption: `Edited image with: "${prompt}"`,
            ...telegramService.createCancelSessionKeyboard()
          }
        );

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
        throw new Error('Failed to edit image');
      }
    } catch (error) {
      logger.error('Error editing image:', error);
      await telegramService.sendMessage(
        chatId,
        'Sorry, I encountered an error while editing the image. Please try again with a different prompt.'
      );
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

