/**
 * Utility functions for JazzAI - MongoDB Version
 * Removes conversation data storage from logs
 */

import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom logging utility
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDir() {
    try {
      await fs.access(this.logDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.logDir, { recursive: true });
      console.log('Log directory created:', this.logDir);
    }
  }

  /**
   * Format the current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Log an info message
   */
  async info(message, data = null) {
    const formattedMessage = `[INFO] ${this.getTimestamp()}: ${message}`;
    console.log(formattedMessage);
    
    // Only log to console, don't write to file
    if (data && !this.containsUserData(message, data)) {
      console.log(util.inspect(data, { colors: true, depth: 4 }));
    }
  }

  /**
   * Log an error message
   */
  async error(message, error = null) {
    const formattedMessage = `[ERROR] ${this.getTimestamp()}: ${message}`;
    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else {
        console.error(util.inspect(error, { colors: true, depth: 4 }));
      }
    }
    
    // Only log system errors to file, not user data
    if (!this.containsUserData(message, error)) {
      await this.writeToLogFile('error', formattedMessage, error);
    }
  }

  /**
   * Log a debug message
   */
  async debug(message, data = null) {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      const formattedMessage = `[DEBUG] ${this.getTimestamp()}: ${message}`;
      console.debug(formattedMessage);
      
      // Only log to console, don't write to file
      if (data && !this.containsUserData(message, data)) {
        console.debug(util.inspect(data, { colors: true, depth: 4 }));
      }
    }
  }

  /**
   * Check if the message or data contains user conversation data
   * that should be stored only in MongoDB
   */
  containsUserData(message, data = null) {
    // List of keywords indicating user data that should only be in MongoDB
    const userDataKeywords = [
      'message received', 
      'sending message',
      'user message',
      'assistant message',
      'conversation',
      'user profile',
      'mood detected',
      'chat history',
      'user said',
      'assistant replied'
    ];
    
    // Check if message contains any of the keywords
    if (message && typeof message === 'string') {
      if (userDataKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return true;
      }
    }
    
    // Check data object for user content
    if (data) {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (userDataKeywords.some(keyword => dataStr.includes(keyword))) {
        return true;
      }
      
      // Check for common user data fields
      const userDataFields = ['text', 'message', 'content', 'from', 'user', 'assistant', 'userMessage', 'aiResponse'];
      if (typeof data === 'object' && data !== null) {
        if (userDataFields.some(field => data[field] !== undefined)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Write log entry to file
   */
  async writeToLogFile(level, message, data = null) {
    // Skip writing user data to log files
    if (this.containsUserData(message, data)) {
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `jazzai-system-${today}.log`);
      
      let logEntry = `${message}\n`;
      if (data) {
        if (data instanceof Error) {
          logEntry += `${data.stack || data.message}\n`;
        } else {
          // Sanitize any potential user data before writing
          const sanitizedData = this.sanitizeUserData(data);
          logEntry += `${JSON.stringify(sanitizedData, null, 2)}\n`;
        }
      }
      
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  /**
   * Remove sensitive user data from objects before logging
   */
  sanitizeUserData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveFields = ['message', 'text', 'content', 'userMessage', 'aiResponse', 'mood'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field] !== undefined) {
        if (typeof sanitized[field] === 'string') {
          sanitized[field] = '[CONTENT REDACTED]';
        } else if (Array.isArray(sanitized[field])) {
          sanitized[field] = sanitized[field].map(item => 
            typeof item === 'string' ? '[CONTENT REDACTED]' : item
          );
        }
      }
    }
    
    return sanitized;
  }
}

/**
 * Error handling utilities
 */
class ErrorHandler {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(message, code = 500, details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
  }

  /**
   * Handle API errors
   */
  static handleApiError(error) {
    if (error.response) {
      // The request was made and the server responded with an error status
      return this.createErrorResponse(
        error.response.data.message || 'API error',
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // The request was made but no response was received
      return this.createErrorResponse(
        'No response from server',
        503,
        { request: error.request }
      );
    } else {
      // Something happened in setting up the request
      return this.createErrorResponse(
        error.message || 'Unknown error',
        500
      );
    }
  }

  /**
   * Express error handler middleware
   */
  static expressErrorHandler(err, req, res, next) {
    const logger = new Logger();
    logger.error('Express error:', err);
    
    res.status(err.status || 500).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: err.status || 500
      }
    });
  }
}

const LoggerInstance = new Logger();

export { LoggerInstance as Logger, ErrorHandler };