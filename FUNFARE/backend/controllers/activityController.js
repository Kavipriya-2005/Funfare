const Activity = require('../models/Activity');

// GET all activities with filters
exports.getActivities = async (req, res) => {
  try {
    const { budget, type, ageGroup } = req.query;
    let query = {};

    if (budget && budget !== '100') query.price = { $lte: Number(budget) };
    if (type && type !== 'All') query.type = type;
    if (ageGroup && ageGroup !== 'All ages') query.ageGroup = ageGroup;

    const activities = await Activity.find(query);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single activity
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};