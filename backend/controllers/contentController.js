const ContentTemplate = require('../models/ContentTemplate');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a professional copywriter for career content. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/content/linkedin
exports.generateLinkedInPost = async (req, res) => {
    try {
        const { companyName, jobTitle, sentiment } = req.body;
        if (!companyName || !jobTitle) return res.status(400).json({ success: false, message: 'Company name and job title are required' });

        const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const studentName = student.userId?.name || 'Student';

        const prompt = `Write a ${sentiment || 'professional'} LinkedIn placement announcement post for:
- Student Name: ${studentName}
- Company: ${companyName}
- Role: ${jobTitle}

Return JSON:
{
  "title": "Short post title",
  "content": "Full LinkedIn post (150-250 words, include emojis, hashtags at end, engaging tone)"
}

The post should express gratitude, excitement about the new role, and optionally tag the company.`;

        const aiResult = await callGroq(prompt);

        const template = new ContentTemplate({
            studentId: student._id,
            type: 'linkedin',
            title: aiResult.title || `${jobTitle} at ${companyName}`,
            content: aiResult.content || '',
            context: { companyName, jobTitle, sentiment: sentiment || 'professional' }
        });
        await template.save();

        res.status(201).json({ success: true, data: template });
    } catch (err) {
        console.error('LinkedIn post generation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/content/email
exports.generateEmailTemplate = async (req, res) => {
    try {
        const { type, companyName, jobTitle, interviewerName, sentiment } = req.body;
        const emailType = type || 'email_thankyou';

        const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const studentName = student.userId?.name || 'Student';

        const typeLabel = {
            email_thankyou: 'thank-you email after interview',
            email_followup: 'follow-up email to check application status',
            email_inquiry: 'inquiry email about a job opening'
        }[emailType] || 'professional email';

        const prompt = `Write a ${sentiment || 'professional'} ${typeLabel} for:
- Student: ${studentName}
- Company: ${companyName || 'the company'}
- Role: ${jobTitle || 'the position'}
- Interviewer: ${interviewerName || 'Hiring Manager'}

Return JSON:
{
  "subject": "Email subject line",
  "content": "Full email body (150-200 words, professional, polite)"
}`;

        const aiResult = await callGroq(prompt);

        const template = new ContentTemplate({
            studentId: student._id,
            type: emailType,
            title: `${typeLabel} - ${companyName}`,
            subject: aiResult.subject || '',
            content: aiResult.content || '',
            context: { companyName, jobTitle, interviewerName, sentiment: sentiment || 'professional' }
        });
        await template.save();

        res.status(201).json({ success: true, data: template });
    } catch (err) {
        console.error('Email template generation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/content
exports.getTemplates = async (req, res) => {
    try {
        const { type } = req.query;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const filter = { studentId: student._id };
        if (type) filter.type = type;

        const templates = await ContentTemplate.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: templates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /student/content/:id
exports.updateTemplate = async (req, res) => {
    try {
        const { title, subject, content, isFavorite } = req.body;
        const template = await ContentTemplate.findByIdAndUpdate(
            req.params.id,
            { $set: { title, subject, content, isFavorite } },
            { new: true }
        );
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /student/content/:id
exports.deleteTemplate = async (req, res) => {
    try {
        await ContentTemplate.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
