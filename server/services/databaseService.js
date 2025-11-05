/**
 * Database Connection
 * Handles connection to MongoDB
 */

import mongoose from 'mongoose';
import 'dotenv/config';

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jazzai';

class Database {
  constructor() {
    this.connected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (this.connected) {
        console.log('Database already connected');
        return;
      }

      await mongoose.connect(MONGODB_URI, {
        // Connection options
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });

      this.connected = true;
      console.log('Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.connected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.connected = false;
      });

      return mongoose.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (!this.connected) {
      console.log('Database already disconnected');
      return;
    }

    await mongoose.disconnect();
    this.connected = false;
    console.log('Disconnected from MongoDB');
  }
}

const database = new Database();
export default database;