import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  commonPhrases: {
    type: [String],
    default: []
  },
  sentimentTrend: {
    type: String,
    default: 'neutral'
  },
  engagementLevel: {
    type: String,
    default: 'medium'
  },
  topics: {
    type: Map,
    of: Number,
    default: {}
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Insight = mongoose.model('Insight', insightSchema);

export default Insight;