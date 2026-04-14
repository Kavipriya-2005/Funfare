const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,           // removes accidental spaces
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,         // no two users with same email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  preferences: {
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 100 },
    radius: { type: Number, default: 10 },      // miles
    ageGroup: { type: String, default: 'all' }, // 'kids', 'teens', 'adults', 'all'
    interests: [String],                         // ['outdoor', 'museum', 'hiking']
  },
  savedPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
  wishlist:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
}, {
  timestamps: true,  // auto-adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);