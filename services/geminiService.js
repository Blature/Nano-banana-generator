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
      
      for (const part of parts) {
        // Check for inline_data (base64 image)
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
        } else if (part.inline_data) {
          imageBase64 = part.inline_data.data;
        }
        // Check for imageUrl
        else if (part.imageUrl) {
          imageUrl = part.imageUrl.url || part.imageUrl;
        }
        // Check if text contains base64 image data
        else if (part.text) {
          const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (base64Match) {
            imageBase64 = base64Match[1];
          }
          // Check for URL in text
          const urlMatch = part.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          if (urlMatch) {
            imageUrl = urlMatch[0];
          }
        }
      }
      
      if (!imageBase64 && !imageUrl) {
        logger.warn('No image data found in response. Response parts:', JSON.stringify(parts, null, 2));
        throw new Error('No image data found in API response. The model may not support image generation or the response format is unexpected.');
      }
      
      return {
        success: true,
        imageUrl: imageUrl,
        imageBase64: imageBase64,
        data: response,
      };
    } catch (error) {
      logger.error('Error generating image with Gemini:', error);
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('404')) {
        throw new Error(`Model '${this.modelName}' not found. Please check the model name in your .env file.`);
      }
      
      if (error.message && error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in .env file.');
      }
      
      throw error;
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
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('404')) {
        throw new Error(`Model '${this.modelName}' not found. Please check the model name in your .env file.`);
      }
      
      if (error.message && error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in .env file.');
      }
      
      throw error;
    }
  }

  // Helper method to convert image buffer to base64
  static bufferToBase64(buffer) {
    return buffer.toString('base64');
  }
}

module.exports = new GeminiService();
