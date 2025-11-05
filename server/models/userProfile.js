import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: ''
  },
  mood: {
    type: String,
    default: 'neutral'
  },
  favoriteTopics: {
    type: [String],
    default: []
  },
  lastInteraction: {
    type: Date,
    default: null
  },
  conversationCount: {
    type: Number,
    default: 0
  },
  personalDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;