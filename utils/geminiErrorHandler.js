const logger = require('./logger');

/**
 * Analyzes Gemini API errors and returns user-friendly messages
 */
class GeminiErrorHandler {
  /**
   * Analyzes error and returns appropriate error type and message
   * @param {Error} error - The error object
   * @returns {Object} - { type: string, userMessage: string, shouldRetry: boolean }
   */
  static analyzeError(error) {
    const errorMessage = error.message || '';
    const errorString = JSON.stringify(error).toLowerCase();
    
    // Rate limit / Quota exceeded
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429') ||
      errorString.includes('resource_exhausted') ||
      errorString.includes('quota_exceeded')
    ) {
      return {
        type: 'RATE_LIMIT',
        userMessage: '⚠️ Gemini servers are currently busy.\n\n' +
          'Please wait a few minutes and try again.',
        shouldRetry: true,
        retryAfter: 60 // seconds
      };
    }

    // Server error / Service unavailable
    if (
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('500') ||
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('internal server error') ||
      errorString.includes('unavailable') ||
      errorString.includes('server_error')
    ) {
      return {
        type: 'SERVER_ERROR',
        userMessage: '⚠️ Gemini servers are currently unavailable.\n\n' +
          'Please wait a few minutes and try again.',
        shouldRetry: true,
        retryAfter: 120 // seconds
      };
    }

    // Timeout
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      return {
        type: 'TIMEOUT',
        userMessage: '⏱️ Your request timed out.\n\n' +
          'Please try again.',
        shouldRetry: true,
        retryAfter: 30 // seconds
      };
    }

    // Model not found
    if (
      errorMessage.includes('404') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('model') && errorMessage.includes('not found')
    ) {
      return {
        type: 'MODEL_NOT_FOUND',
        userMessage: '❌ The requested model is not available.\n\n' +
          'Please contact an administrator.',
        shouldRetry: false
      };
    }

    // API key issues
    if (
      errorMessage.includes('API key') ||
      errorMessage.includes('401') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('permission denied') ||
      errorString.includes('invalid_api_key') ||
      errorString.includes('authentication')
    ) {
      return {
        type: 'AUTH_ERROR',
        userMessage: '🔐 Authentication error.\n\n' +
          'Please contact an administrator.',
        shouldRetry: false
      };
    }

    // Model doesn't support image generation
    if (
      errorMessage.includes('may not support image generation') ||
      errorMessage.includes('Model returned text instead of image') ||
      errorMessage.includes('No image data found')
    ) {
      return {
        type: 'MODEL_LIMITATION',
        userMessage: '⚠️ The model used does not support image generation.\n\n' +
          'Please contact an administrator.',
        shouldRetry: false
      };
    }

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNRESET')
    ) {
      return {
        type: 'NETWORK_ERROR',
        userMessage: '🌐 Connection error to Gemini servers.\n\n' +
          'Please check your internet connection and try again.',
        shouldRetry: true,
        retryAfter: 30 // seconds
      };
    }

    // Content filter / Safety
    if (
      errorMessage.includes('safety') ||
      errorMessage.includes('content filter') ||
      errorMessage.includes('blocked') ||
      errorString.includes('safety_rating')
    ) {
      return {
        type: 'SAFETY_FILTER',
        userMessage: '🚫 Your request was blocked by safety filters.\n\n' +
          'Please modify your prompt and try again.',
        shouldRetry: false
      };
    }

    // Generic Gemini API error
    if (
      errorString.includes('google') ||
      errorString.includes('gemini') ||
      errorString.includes('generative')
    ) {
      return {
        type: 'GEMINI_API_ERROR',
        userMessage: '⚠️ An error occurred with the Gemini service.\n\n' +
          'Please wait a few minutes and try again.',
        shouldRetry: true,
        retryAfter: 60 // seconds
      };
    }

    // Unknown error
    return {
      type: 'UNKNOWN_ERROR',
      userMessage: '❌ An error occurred.\n\n' +
        'Please try again or contact an administrator.',
      shouldRetry: true,
      retryAfter: 30 // seconds
    };
  }

  /**
   * Gets user-friendly error message
   * @param {Error} error - The error object
   * @returns {string} - User-friendly message in English
   */
  static getUserMessage(error) {
    const analysis = this.analyzeError(error);
    logger.info(`Gemini error type: ${analysis.type}, shouldRetry: ${analysis.shouldRetry}`);
    return analysis.userMessage;
  }

  /**
   * Checks if error should trigger retry
   * @param {Error} error - The error object
   * @returns {boolean} - Whether to retry
   */
  static shouldRetry(error) {
    return this.analyzeError(error).shouldRetry;
  }

  /**
   * Gets retry delay in seconds
   * @param {Error} error - The error object
   * @returns {number} - Retry delay in seconds
   */
  static getRetryDelay(error) {
    return this.analyzeError(error).retryAfter || 30;
  }
}

module.exports = GeminiErrorHandler;

