const Activity = require('../models/Activity');

const getSuggestions = async (req, res) => {
  const {
    budgetMin = 0,
    budgetMax = 50,
    interests = [],
    ageGroup = 'all',
    groupSize = 1,
  } = req.body;

  const min = Number(budgetMin);
  const max = Number(budgetMax);
  const size = Number(groupSize) || 1;

  try {
    // Fetch matching activities from database
    let dbQuery = {
      price: { $gte: min, $lte: max },
    };

    if (ageGroup && ageGroup !== 'all') {
      dbQuery.ageGroup = { $in: [ageGroup, 'All ages'] };
    }

    if (interests.length > 0) {
      dbQuery.category = { $in: interests };
    }

    const dbActivities = await Activity.find(dbQuery).limit(10);

    // Convert DB activities to suggestion format
    const dbSuggestions = dbActivities.map(a => ({
      name: a.name,
      category: a.category,
      reason: generateReason(a, min, max, interests, ageGroup, size),
      estimatedCost: a.price === 0
        ? 'Free'
        : `₹${a.price} per person`,
      totalCost: a.price === 0
        ? `Free for ${size} ${size === 1 ? 'person' : 'people'}`
        : `₹${(a.price * size).toFixed(0)} for ${size} ${size === 1 ? 'person' : 'people'}`,
      duration: getCategoryDuration(a.category),
      tip: getCategoryTip(a.category),
      isInDatabase: true,
      activityId: a._id.toString(),
      rating: a.rating,
      location: a.locationText || 'Nearby',
    }));

    // Fill remaining slots with smart generic suggestions
    const needed = Math.max(0, 4 - dbSuggestions.length);
    const genericSuggestions = getGenericSuggestions(
      min, max, interests, ageGroup, size, needed, dbSuggestions
    );

    const allSuggestions = [...dbSuggestions, ...genericSuggestions].slice(0, 4);

    // Sort — DB activities first, then by rating
    allSuggestions.sort((a, b) => {
      if (a.isInDatabase && !b.isInDatabase) return -1;
      if (!a.isInDatabase && b.isInDatabase) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    res.json({
      suggestions: allSuggestions,
      meta: {
        budget: { min, max },
        interests,
        ageGroup,
        groupSize: size,
        generatedAt: new Date().toISOString(),
        fromDatabase: dbSuggestions.length,
        generic: genericSuggestions.length,
      },
    });

  } catch (error) {
    console.error('Suggestion error:', error.message);
    res.status(500).json({
      message: 'Could not generate suggestions',
      error: error.message,
    });
  }
};

// Generate a personal reason based on user preferences
const generateReason = (activity, min, max, interests, ageGroup, size) => {
  const reasons = [];

  if (activity.price === 0) {
    reasons.push('completely free');
  } else if (activity.price <= max * 0.6) {
    reasons.push(`well within your ₹${max} budget`);
  } else {
    reasons.push(`fits your ₹${min}–₹${max} budget`);
    reasons.push(`matches your interest in ${activity.category}`);
  }

  if (ageGroup !== 'all' && activity.ageGroup === ageGroup) {
    reasons.push(`great for ${ageGroup}`);
  } else if (activity.ageGroup === 'all') {
    reasons.push('suitable for all ages');
  }

  if (activity.rating >= 4.5) {
    reasons.push(`highly rated at ${activity.rating}/5`);
  }

  if (size > 2) {
    reasons.push(`fun for groups of ${size}`);
  }

  return `This is ${reasons.join(', ')}.`;
};

// Typical duration per category
const getCategoryDuration = (category) => {
  const durations = {
    outdoor: '2–4 hours', museum: '2–3 hours',
    hiking: '3–5 hours', family: '2–4 hours',
    sports: '1–3 hours', food: '1–2 hours',
    arts: '2–3 hours', other: '2–3 hours',
  };
  return durations[category] || '2–3 hours';
};

// Practical tip per category
const getCategoryTip = (category) => {
  const tips = {
    outdoor: 'Go early in the morning to avoid crowds and enjoy cooler weather.',
    museum: 'Check for free admission days — many museums offer them on weekdays.',
    hiking: 'Bring water, snacks, and wear comfortable shoes.',
    family: 'Book in advance on weekends — popular spots fill up fast.',
    sports: 'Arrive 15 minutes early to warm up and get settled.',
    food: 'Visit during off-peak hours (before noon or after 2pm) for shorter waits.',
    arts: 'Many venues offer student or group discounts — ask at the door.',
    other: 'Check the venue website for any special weekend events.',
  };
  return tips[category] || 'Check the venue website for weekend hours and availability.';
};

// Generate smart generic suggestions based on budget and interests
const getGenericSuggestions = (min, max, interests, ageGroup, size, count, existing) => {
  if (count <= 0) return [];

  const pool = [
    {
      name: 'Local Nature Trail Walk',
      category: 'outdoor',
      budgetMax: 999, budgetMin: 0,
      ageGroups: ['all'],
      reason: 'A refreshing free outdoor activity perfect for any budget and group size.',
      estimatedCost: 'Free',
      duration: '1–3 hours',
      tip: 'Search "trails near me" on Google Maps to find the closest one.',
    },
    {
      name: 'Community Farmers Market',
      category: 'food',
      budgetMax: 999, budgetMin: 0,
      ageGroups: ['all'],
      reason: 'Free to browse, great local food, and a fun weekend atmosphere.',
      estimatedCost: 'Free to enter',
      duration: '1–2 hours',
      tip: 'Go early for the best selection before popular stalls sell out.',
    },
    {
      name: 'Public Park Picnic',
      category: 'outdoor',
      budgetMax: 999, budgetMin: 0,
      ageGroups: ['all'],
      reason: 'A relaxing zero-cost activity you can customize for any group.',
      estimatedCost: 'Free',
      duration: '2–4 hours',
      tip: 'Pack a blanket, snacks, and a frisbee for a perfect afternoon.',
    },
    {
      name: 'Public Library Events',
      category: 'arts',
      budgetMax: 999, budgetMin: 0,
      ageGroups: ['all', 'kids', 'teens'],
      reason: 'Libraries often host free weekend events, workshops, and exhibitions.',
      estimatedCost: 'Free',
      duration: '1–2 hours',
      tip: 'Check your local library website for this weekend\'s schedule.',
    },
    {
      name: 'Local History Museum',
      category: 'museum',
      budgetMax: 20, budgetMin: 0,
      ageGroups: ['all'],
      reason: 'Affordable and educational — great for a rainy weekend day.',
      estimatedCost: '₹5–₹15 per person',
      duration: '2–3 hours',
      tip: 'Many local museums have free entry for children under 12.',
    },
    {
      name: 'Botanical Garden Visit',
      category: 'outdoor',
      budgetMax: 25, budgetMin: 0,
      ageGroups: ['all'],
      reason: 'Beautiful, peaceful, and budget-friendly — perfect for a weekend stroll.',
      estimatedCost: '₹8–₹15 per person',
      duration: '2–3 hours',
      tip: 'Weekday mornings are less crowded if you can go then.',
    },
    {
      name: 'Mini Golf',
      category: 'sports',
      budgetMax: 30, budgetMin: 10,
      ageGroups: ['all', 'kids', 'family'],
      reason: 'Fun for everyone, easy on the wallet, and no experience needed.',
      estimatedCost: '₹8–₹15 per person',
      duration: '1–2 hours',
      tip: 'Look for combo deals that include multiple rounds.',
    },
    {
      name: 'Cooking or Craft Workshop',
      category: 'arts',
      budgetMax: 60, budgetMin: 20,
      ageGroups: ['all', 'teens', 'adults'],
      reason: 'Learn something new while having fun — a great weekend experience.',
      estimatedCost: '₹25–₹45 per person',
      duration: '2–3 hours',
      tip: 'Search Eventbrite or Meetup.com for local workshops this weekend.',
    },
    {
      name: 'Kayaking or Canoeing',
      category: 'outdoor',
      budgetMax: 60, budgetMin: 20,
      ageGroups: ['all', 'adults', 'teens'],
      reason: 'An exciting outdoor adventure that fits a mid-range budget.',
      estimatedCost: '₹25–₹50 per person',
      duration: '2–4 hours',
      tip: 'Book in advance on weekends — rentals fill up quickly.',
    },
    {
      name: 'Local Food Tour',
      category: 'food',
      budgetMax: 70, budgetMin: 20,
      ageGroups: ['all', 'adults'],
      reason: 'Explore local cuisine and hidden gems in your city.',
      estimatedCost: '₹30–₹60 per person',
      duration: '2–3 hours',
      tip: 'Come hungry and wear comfortable walking shoes.',
    },
    {
      name: 'Rock Climbing Gym',
      category: 'sports',
      budgetMax: 999, budgetMin: 15,
      ageGroups: ['all', 'teens', 'adults'],
      reason: 'A thrilling full-body workout that is great for all skill levels.',
      estimatedCost: '₹20–₹40 per person',
      duration: '2–3 hours',
      tip: 'Most gyms offer beginner instruction included with entry.',
    },
    {
      name: 'Escape Room Experience',
      category: 'family',
      budgetMax: 999, budgetMin: 20,
      ageGroups: ['all', 'teens', 'adults'],
      reason: 'A fun team challenge perfect for groups — great value split between people.',
      estimatedCost: '₹25–₹35 per person',
      duration: '1–2 hours',
      tip: 'Book at least a day ahead — popular time slots sell out fast.',
    },
  ];

  const existingNames = existing.map(s => s.name.toLowerCase());

  const filtered = pool.filter(s => {
    if (existingNames.includes(s.name.toLowerCase())) return false;
    if (s.budgetMin > max) return false;
    if (s.budgetMax < min && s.budgetMax !== 999) return false;
    if (ageGroup !== 'all' &&
        !s.ageGroups.includes(ageGroup) &&
        !s.ageGroups.includes('all')) return false;
    return true;
  });

  // Sort: matching interests first
  filtered.sort((a, b) => {
    const aMatch = interests.includes(a.category) ? 1 : 0;
    const bMatch = interests.includes(b.category) ? 1 : 0;
    return bMatch - aMatch;
  });

  return filtered.slice(0, count).map(s => ({
    ...s,
    totalCost: `Approx. for ${size} ${size === 1 ? 'person' : 'people'}`,
    isInDatabase: false,
    activityId: null,
    rating: null,
  }));
};

module.exports = { getSuggestions };