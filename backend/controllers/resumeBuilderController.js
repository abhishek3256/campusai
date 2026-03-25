const ResumeTemplate = require('../models/ResumeTemplate');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a professional resume writer. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/resume-builder/generate — create new resume with AI polish
exports.buildResume = async (req, res) => {
    try {
        const { templateName, formData } = req.body;
        if (!formData?.personal?.name) return res.status(400).json({ success: false, message: 'Personal info (name) is required' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // AI polish the summary and experience bullet points
        const prompt = `You are a professional resume writer. Given the following raw resume data, generate an ATS-optimized, professional resume in a clean text format with all sections. Polish the summary and bullet points to be impactful and concise. Use action verbs. Return JSON:
{
  "summary": "polished 2-3 sentence professional summary",
  "experienceBullets": [
    { "company": "...", "role": "...", "bullets": ["bullet 1", "bullet 2", "bullet 3"] }
  ],
  "projectHighlights": [
    { "name": "...", "highlight": "1-2 sentence polished description mentioning impact" }
  ],
  "skillKeywords": ["keyword1", "keyword2"]
}

Raw data:
Name: ${formData.personal.name}
Current Summary: ${formData.personal.summary || 'None provided'}
Skills: ${(formData.skills || []).join(', ')}
Experience: ${JSON.stringify(formData.experience || [])}
Projects: ${JSON.stringify(formData.projects || [])}`;

        let aiContent = {};
        try {
            aiContent = await callGroq(prompt);
        } catch (aiErr) {
            console.error('AI resume polish failed, saving raw data:', aiErr.message);
        }

        const resume = new ResumeTemplate({
            studentId: student._id,
            templateName: templateName || 'My Resume',
            formData,
            generatedContent: JSON.stringify(aiContent)
        });
        await resume.save();

        res.status(201).json({ success: true, data: resume, aiContent });
    } catch (err) {
        console.error('Build resume error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/resume-builder
exports.getBuiltResumes = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const resumes = await ResumeTemplate.find({ studentId: student._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: resumes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /student/resume-builder/:id
exports.updateResume = async (req, res) => {
    try {
        const { templateName, formData } = req.body;
        const resume = await ResumeTemplate.findByIdAndUpdate(
            req.params.id,
            { $set: { templateName, formData, generatedContent: '' } },
            { new: true }
        );
        if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
        res.json({ success: true, data: resume });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /student/resume-builder/:id
exports.deleteResume = async (req, res) => {
    try {
        await ResumeTemplate.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Resume deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
