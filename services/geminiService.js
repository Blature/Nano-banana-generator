const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/config');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.apiUrl = config.gemini.apiUrl;
  }

  async generateImage(prompt) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const requestBody = {
        contents: [{
          parts: [{
            text: `Generate an image based on this prompt: ${prompt}`
          }]
        }]
      };

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract image data from response
      // NOTE: The actual response structure may vary based on Gemini API implementation
      // The Gemini 3 Pro Nano Banana API response structure needs to be verified
      // Adjust the parsing below based on the actual API response format
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
        
        // Try to extract image data from various possible response formats
        const parts = candidate.content?.parts || [];
        let imageUrl = null;
        let imageBase64 = null;
        
        for (const part of parts) {
          if (part.inline_data) {
            imageBase64 = part.inline_data.data;
          } else if (part.imageUrl) {
            imageUrl = part.imageUrl;
          } else if (part.text && part.text.includes('data:image')) {
            // Handle base64 data URLs
            const match = part.text.match(/data:image\/[^;]+;base64,(.+)/);
            if (match) {
              imageBase64 = match[1];
            }
          }
        }
        
        return {
          success: true,
          imageUrl: imageUrl,
          imageBase64: imageBase64,
          data: response.data,
        };
      }

      throw new Error('Unexpected response format from Gemini API');
    } catch (error) {
      logger.error('Error generating image with Gemini:', error);
      throw error;
    }
  }

  async editImage(imageBase64, prompt) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const requestBody = {
        contents: [{
          parts: [
            {
              text: `Edit this image based on this prompt: ${prompt}`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      };

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
        
        // Try to extract image data from various possible response formats
        const parts = candidate.content?.parts || [];
        let imageUrl = null;
        let imageBase64 = null;
        
        for (const part of parts) {
          if (part.inline_data) {
            imageBase64 = part.inline_data.data;
          } else if (part.imageUrl) {
            imageUrl = part.imageUrl;
          } else if (part.text && part.text.includes('data:image')) {
            // Handle base64 data URLs
            const match = part.text.match(/data:image\/[^;]+;base64,(.+)/);
            if (match) {
              imageBase64 = match[1];
            }
          }
        }
        
        return {
          success: true,
          imageUrl: imageUrl,
          imageBase64: imageBase64,
          data: response.data,
        };
      }

      throw new Error('Unexpected response format from Gemini API');
    } catch (error) {
      logger.error('Error editing image with Gemini:', error);
      throw error;
    }
  }

  // Helper method to convert image buffer to base64
  static bufferToBase64(buffer) {
    return buffer.toString('base64');
  }
}

module.exports = new GeminiService();

