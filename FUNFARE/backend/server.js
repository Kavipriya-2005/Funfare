const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware — lets Express read JSON bodies and handle cross-origin requests
app.use(cors());
app.use(express.json());

// Routes — we'll add more as we build
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check — visit http://localhost:5000/api/health to confirm it's running
app.get('/api/health', (req, res) => {
  res.json({ status: 'FunFare API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});