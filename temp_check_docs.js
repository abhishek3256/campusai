const mongoose = require('mongoose');
const Application = require('./backend/models/Application');

mongoose.connect('mongodb://localhost:27017/campusai', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    try {
        // Just find any application and check its documents
        const app = await Application.findOne({ "documents.0": { $exists: true } });
        if (app) {
            console.log("Documents found:", app.documents);
        } else {
            const anyApp = await Application.findOne();
            console.log("No app with documents found. First app docs:", anyApp?.documents);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
