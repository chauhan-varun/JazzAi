import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  triggerTime: {
    type: Date,
    required: true,
    index: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create compound index for efficient querying by user and completion status
reminderSchema.index({ userId: 1, completed: 1, triggerTime: 1 });
reminderSchema.index({ phoneNumber: 1, completed: 1, triggerTime: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;