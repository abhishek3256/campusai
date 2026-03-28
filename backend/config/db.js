const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
    if (cachedDb) {
        return cachedDb;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        cachedDb = conn;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return cachedDb;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
