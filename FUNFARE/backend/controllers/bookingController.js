const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

// Generates a random confirmation code like "FUNFARE-AB12CD"
const generateConfirmationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'FUNFARE-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// POST /api/bookings — create a new booking
const createBooking = async (req, res) => {
  const { activityId, bookingDate, tickets } = req.body;

  // Validate required fields
  if (!activityId || !bookingDate) {
    return res.status(400).json({ message: 'activityId and bookingDate are required' });
  }

  try {
    // Check activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const ticketCount = tickets || 1;
    const totalPrice = (activity.price || 0) * ticketCount;

    const booking = await Booking.create({
      user: req.user._id,
      activity: activityId,
      bookingDate: new Date(bookingDate),
      tickets: ticketCount,
      totalPrice,
      status: 'confirmed',
      confirmationCode: generateConfirmationCode(),
    });

    // Return booking with activity details populated
    await booking.populate('activity', 'name category locationText price images');

    res.status(201).json({
      message: 'Booking confirmed!',
      booking,
    });

  } catch (error) {
    console.error('Booking error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/my — get all bookings for the logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('activity', 'name category locationText price images rating')
      .sort({ createdAt: -1 }); // newest first

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/bookings/:id — cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Make sure the booking belongs to this user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking };