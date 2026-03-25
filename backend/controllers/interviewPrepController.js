const InterviewPrep = require('../models/InterviewPrep');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are an expert interview coach. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/interview-prep/generate
exports.generatePrep = async (req, res) => {
    try {
        const { jobTitle, jobDescription, companyName } = req.body;
        if (!jobTitle) return res.status(400).json({ success: false, message: 'Job title is required' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const prompt = `Generate 15 interview flashcards for the role: "${jobTitle}" at "${companyName || 'a tech company'}".
Job Description context: ${jobDescription ? jobDescription.substring(0, 500) : 'General software engineering role'}.

Return JSON with this structure:
{
  "flashcards": [
    { "question": "...", "answer": "...", "difficulty": "easy|medium|hard", "category": "Behavioral|Technical|HR|System Design" }
  ]
}

Include a mix of:
- 5 technical questions specific to the role
- 4 behavioral (STAR format answers)  
- 3 HR questions (salary, notice period, etc.)
- 3 problem-solving / situational questions`;

        const aiResult = await callGroq(prompt);
        const flashcards = (aiResult.flashcards || []).slice(0, 15);

        const prep = new InterviewPrep({
            studentId: student._id,
            jobTitle,
            jobDescription: jobDescription || '',
            companyName: companyName || '',
            flashcards,
            notes: ''
        });
        await prep.save();

        res.status(201).json({ success: true, data: prep });
    } catch (err) {
        console.error('Interview prep generation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/interview-prep
exports.getPreps = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const preps = await InterviewPrep.find({ studentId: student._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: preps });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/interview-prep/:id
exports.getPrepById = async (req, res) => {
    try {
        const prep = await InterviewPrep.findById(req.params.id);
        if (!prep) return res.status(404).json({ success: false, message: 'Prep session not found' });
        res.json({ success: true, data: prep });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /student/interview-prep/:id
exports.updatePrep = async (req, res) => {
    try {
        const { notes, isCompleted, flashcards } = req.body;
        const prep = await InterviewPrep.findByIdAndUpdate(
            req.params.id,
            { $set: { notes, isCompleted, flashcards } },
            { new: true }
        );
        if (!prep) return res.status(404).json({ success: false, message: 'Prep session not found' });
        res.json({ success: true, data: prep });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /student/interview-prep/:id
exports.deletePrep = async (req, res) => {
    try {
        await InterviewPrep.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Prep session deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
