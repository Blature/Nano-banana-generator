const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.modelName = config.gemini.modelName || 'gemini-3-pro-image-preview';
  }

  async generateImage(prompt) {
    try {
      logger.info(`Generating image with model: ${this.modelName}, prompt: ${prompt.substring(0, 50)}...`);
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const fullPrompt = `Generate an image based on this prompt: ${prompt}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      
      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts || [];
      let imageBase64 = null;
      let imageUrl = null;
      let responseText = '';
      
      // Log full response for debugging
      logger.debug('Full API response:', JSON.stringify({
        candidates: response.candidates,
        parts: parts
      }, null, 2));
      
      for (const part of parts) {
        // Check for inline_data (base64 image)
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          logger.info('Found image in inlineData');
        } else if (part.inline_data) {
          imageBase64 = part.inline_data.data;
          logger.info('Found image in inline_data');
        }
        // Check for imageUrl
        else if (part.imageUrl) {
          imageUrl = part.imageUrl.url || part.imageUrl;
          logger.info('Found image URL:', imageUrl);
        }
        // Check if text contains base64 image data
        else if (part.text) {
          responseText += part.text;
          const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (base64Match) {
            imageBase64 = base64Match[1];
            logger.info('Found base64 image in text');
          }
          // Check for URL in text
          const urlMatch = part.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          if (urlMatch) {
            imageUrl = urlMatch[0];
            logger.info('Found image URL in text:', imageUrl);
          }
        }
      }
      
      // If no image found, log the response text for debugging
      if (!imageBase64 && !imageUrl) {
        logger.warn('No image data found in response.');
        logger.warn('Response text:', responseText || 'No text in response');
        logger.warn('Response parts structure:', JSON.stringify(parts, null, 2));
        
        // Check if model returned text instead of image
        if (responseText) {
          throw new Error(`Model returned text instead of image. Response: "${responseText.substring(0, 200)}". The model '${this.modelName}' may not support image generation. Please check if this model is designed for image generation.`);
        }
        
        throw new Error(`No image data found in API response. The model '${this.modelName}' may not support image generation or the response format is unexpected. Please verify the model supports image generation.`);
      }
      
      return {
        success: true,
        imageUrl: imageUrl,
        imageBase64: imageBase64,
        data: response,
      };
    } catch (error) {
      logger.error('Error generating image with Gemini:', error);
      
      // Log error details for debugging
      if (error.response) {
        logger.error('API Response status:', error.response.status);
        logger.error('API Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Create a custom error with more details
      const enhancedError = new Error(error.message || 'Unknown error occurred');
      enhancedError.originalError = error;
      enhancedError.response = error.response;
      enhancedError.statusCode = error.response?.status || error.statusCode;
      
      throw enhancedError;
    }
  }

  async editImage(imageBase64, prompt) {
    try {
      logger.info(`Editing image with model: ${this.modelName}, prompt: ${prompt.substring(0, 50)}...`);
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const fullPrompt = `Edit this image based on this prompt: ${prompt}`;
      
      // Prepare the image part
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      };
      
      const result = await model.generateContent([fullPrompt, imagePart]);
      const response = await result.response;
      
      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts || [];
      let editedImageBase64 = null;
      let editedImageUrl = null;
      
      for (const part of parts) {
        // Check for inline_data (base64 image)
        if (part.inlineData) {
          editedImageBase64 = part.inlineData.data;
        } else if (part.inline_data) {
          editedImageBase64 = part.inline_data.data;
        }
        // Check for imageUrl
        else if (part.imageUrl) {
          editedImageUrl = part.imageUrl.url || part.imageUrl;
        }
        // Check if text contains base64 image data
        else if (part.text) {
          const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (base64Match) {
            editedImageBase64 = base64Match[1];
          }
          // Check for URL in text
          const urlMatch = part.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          if (urlMatch) {
            editedImageUrl = urlMatch[0];
          }
        }
      }
      
      if (!editedImageBase64 && !editedImageUrl) {
        logger.warn('No edited image data found in response. Response parts:', JSON.stringify(parts, null, 2));
        throw new Error('No edited image data found in API response. The model may not support image editing or the response format is unexpected.');
      }
      
      return {
        success: true,
        imageUrl: editedImageUrl,
        imageBase64: editedImageBase64,
        data: response,
      };
    } catch (error) {
      logger.error('Error editing image with Gemini:', error);
      
      // Log error details for debugging
      if (error.response) {
        logger.error('API Response status:', error.response.status);
        logger.error('API Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Create a custom error with more details
      const enhancedError = new Error(error.message || 'Unknown error occurred');
      enhancedError.originalError = error;
      enhancedError.response = error.response;
      enhancedError.statusCode = error.response?.status || error.statusCode;
      
      throw enhancedError;
    }
  }

  // Helper method to convert image buffer to base64
  static bufferToBase64(buffer) {
    return buffer.toString('base64');
  }
}

module.exports = new GeminiService();
