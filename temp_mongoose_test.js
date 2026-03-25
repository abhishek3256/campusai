const mongoose = require('mongoose');
const applicationSchema = new mongoose.Schema({
    documents: [{
        type: { type: String, enum: ['pan', 'aadhaar', '10th', '12th', 'uan', 'nsr'] },
        url: String,
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        aiConfidence: Number,
        aiNotes: String,
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date
    }]
});
const App = mongoose.model('FakeApp', applicationSchema);
const doc = new App();
doc.documents.push({ type: 'pan', url: 'http://example.com' });
console.log(doc.toObject().documents);
