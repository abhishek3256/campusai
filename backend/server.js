const dotenv = require('dotenv');
// Load env vars immediately
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Trust reverse proxy (Vercel/Render) for express-rate-limit to work correctly
app.set('trust proxy', 1);

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
// Serve static files with specific headers for PDFs and CORS
app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.set('Content-Type', 'application/pdf');
            res.set('Content-Disposition', 'inline');
            res.set('Access-Control-Allow-Origin', '*'); // Explicitly allow access
        }
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000 // Increased from 100 to prevent locking out devs during heavy development testing
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/company', require('./routes/company'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/applications', require('./routes/application'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/assessment', require('./routes/assessment'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
