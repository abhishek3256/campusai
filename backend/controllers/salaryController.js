const SalaryInsight = require('../models/SalaryInsight');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a salary data expert for India tech market. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/salary-insights/generate
exports.generateInsights = async (req, res) => {
    try {
        const { role, location, experienceLevel } = req.body;
        if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const prompt = `Provide salary insights for a "${experienceLevel || 'fresher'}" level "${role}" in "${location || 'India'}".

Return JSON:
{
  "minSalary": <number in LPA>,
  "maxSalary": <number in LPA>,
  "avgSalary": <number in LPA>,
  "currency": "INR",
  "marketDemand": "High|Moderate|Low",
  "topCompanies": ["company 1", "company 2", "company 3", "company 4", "company 5"],
  "relatedRoles": ["role1", "role2", "role3"],
  "tips": [
    "negotiation tip 1",
    "negotiation tip 2",
    "negotiation tip 3",
    "negotiation tip 4",
    "negotiation tip 5"
  ]
}

Base your response on current Indian tech market data for ${new Date().getFullYear()}.`;

        const aiResult = await callGroq(prompt);

        const insight = new SalaryInsight({
            studentId: student._id,
            role,
            location: location || 'India',
            experienceLevel: experienceLevel || 'fresher',
            minSalary: aiResult.minSalary || 0,
            maxSalary: aiResult.maxSalary || 0,
            avgSalary: aiResult.avgSalary || 0,
            currency: aiResult.currency || 'INR',
            tips: aiResult.tips || [],
            marketDemand: aiResult.marketDemand || 'Moderate',
            topCompanies: aiResult.topCompanies || [],
            relatedRoles: aiResult.relatedRoles || []
        });
        await insight.save();

        res.status(201).json({ success: true, data: insight });
    } catch (err) {
        console.error('Salary insights error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/salary-insights
exports.getHistory = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const insights = await SalaryInsight.find({ studentId: student._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: insights });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /student/salary-insights/:id
exports.deleteInsight = async (req, res) => {
    try {
        await SalaryInsight.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Insight deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
