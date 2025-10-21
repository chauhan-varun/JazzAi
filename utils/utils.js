/**
 * Utility functions for JazzAI
 */

const fs = require('fs').promises;
const path = require('path');
const util = require('util');

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
    
    if (data) {
      console.log(util.inspect(data, { colors: true, depth: 4 }));
    }
    
    await this.writeToLogFile('info', formattedMessage, data);
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
    
    await this.writeToLogFile('error', formattedMessage, error);
  }

  /**
   * Log a debug message
   */
  async debug(message, data = null) {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      const formattedMessage = `[DEBUG] ${this.getTimestamp()}: ${message}`;
      console.debug(formattedMessage);
      
      if (data) {
        console.debug(util.inspect(data, { colors: true, depth: 4 }));
      }
      
      await this.writeToLogFile('debug', formattedMessage, data);
    }
  }

  /**
   * Write log entry to file
   */
  async writeToLogFile(level, message, data = null) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `jazzai-${today}.log`);
      
      let logEntry = `${message}\n`;
      if (data) {
        if (data instanceof Error) {
          logEntry += `${data.stack || data.message}\n`;
        } else {
          logEntry += `${JSON.stringify(data, null, 2)}\n`;
        }
      }
      
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
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

module.exports = {
  Logger: new Logger(),
  ErrorHandler
};