const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'Other' },
  category: {
    type: String,
    enum: ['outdoor', 'museum', 'hiking', 'family', 'sports', 'food', 'arts', 'other'],
    default: 'other',
  },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  reviews: {
    type: [
      new mongoose.Schema({
        user: { type: String, default: 'Guest' },
        rating: { type: Number, default: 0 },
        comment: { type: String, default: '' },
      }, { _id: false })
    ],
    default: [],
  },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 4.0 },
  reviewCount: { type: Number, default: 0 },
  ageGroup: { type: String, default: 'All ages' },
  distance: { type: Number, default: 0 },
  locationText: { type: String, default: '' },  // human readable address
  availability: { type: String, default: 'Open daily · 6:00 AM – 8:00 PM' },
  latitude: { type: Number, default: null },     // ← new
  longitude: { type: Number, default: null },    // ← new
  bookingAvailable: { type: Boolean, default: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);