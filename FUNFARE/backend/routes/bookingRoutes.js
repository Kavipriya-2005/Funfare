const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);         // create booking
router.get('/my', protect, getMyBookings);         // get my bookings
router.put('/:id/cancel', protect, cancelBooking); // cancel booking

module.exports = router;