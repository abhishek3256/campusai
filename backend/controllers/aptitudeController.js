const AptitudeTest = require('../models/AptitudeTest');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are an aptitude test creator. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/aptitude/generate
exports.generateTest = async (req, res) => {
    try {
        const { category, difficulty } = req.body;
        if (!category) return res.status(400).json({ success: false, message: 'Category is required' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const catLabel = { quantitative: 'Quantitative Aptitude (arithmetic, percentages, time & work, profit & loss)', logical: 'Logical Reasoning (series, analogies, coding-decoding, syllogisms)', verbal: 'Verbal Ability (synonyms, antonyms, reading comprehension, grammar)', mixed: 'Mixed (quantitative, logical, and verbal combined)' }[category] || category;

        const prompt = `Generate 10 multiple-choice aptitude questions for category: ${catLabel}. Difficulty: ${difficulty || 'medium'}.

Return JSON:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "category": "${category}"
    }
  ]
}

Ensure correctAnswer is the 0-based index of the correct option. Questions must be clear and solvable.`;

        const aiResult = await callGroq(prompt);
        const questions = (aiResult.questions || []).slice(0, 10);

        const test = new AptitudeTest({
            studentId: student._id,
            category,
            difficulty: difficulty || 'medium',
            questions,
            studentAnswers: new Array(questions.length).fill(-1),
            totalQuestions: questions.length
        });
        await test.save();

        // Return questions WITHOUT correct answers (to prevent cheating)
        const sanitized = { ...test.toObject(), questions: test.questions.map(q => ({ question: q.question, options: q.options, category: q.category })) };
        res.status(201).json({ success: true, data: sanitized });
    } catch (err) {
        console.error('Aptitude test generation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/aptitude/:id/submit
exports.submitTest = async (req, res) => {
    try {
        const { answers, timeTaken } = req.body;
        const test = await AptitudeTest.findById(req.params.id);
        if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
        if (test.isCompleted) return res.status(400).json({ success: false, message: 'Test already submitted' });

        const score = test.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0);

        test.studentAnswers = answers;
        test.score = score;
        test.timeTaken = timeTaken || 0;
        test.isCompleted = true;
        await test.save();

        res.json({ success: true, data: test });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/aptitude/results
exports.getResults = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const results = await AptitudeTest.find({ studentId: student._id, isCompleted: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: GET /admin/aptitude-results
exports.getAllResults = async (req, res) => {
    try {
        const results = await AptitudeTest.find({ isCompleted: true })
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
