const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const Application = require('./backend/models/Application');
        const Assessment = require('./backend/models/Assessment');

        const apps = await Application.find({ status: { $in: ['accepted', 'shortlisted'] } });
        console.log('Accepted/Shortlisted Applications:', apps.map(a => ({
            _id: a._id, studentId: a.studentId, jobId: a.jobId, status: a.status
        })));

        const assessments = await Assessment.find({});
        console.log('All Assessments:', assessments.map(a => ({
            _id: a._id, title: a.basicInfo?.title, jobId: a.jobId, status: a.status, targetStudents: a.targetStudents
        })));

        process.exit(0);
    })
    .catch(console.error);
