const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const testDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const u = await User.findOne({ email: 's' });
    console.log('User found:', u);
    process.exit(0);
  } catch (err) {
    console.error('Mongo Error:', err);
    process.exit(1);
  }
};
testDb();
