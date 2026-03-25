const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const Assessment = require('./models/Assessment');
        const res = await Assessment.updateMany({ status: 'draft' }, { $set: { status: 'published' } });
        console.log('Published assessments:', res.modifiedCount);
        process.exit(0);
    })
    .catch(console.error);
