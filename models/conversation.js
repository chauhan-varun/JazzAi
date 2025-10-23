import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  from: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  userMood: {
    type: String,
    default: 'unknown'
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  }
}, { timestamps: true });

// Create compound index for efficient querying by user and time
conversationSchema.index({ userId: 1, timestamp: -1 });
conversationSchema.index({ phoneNumber: 1, timestamp: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;