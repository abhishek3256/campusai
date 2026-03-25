const CareerRoadmap = require('../models/CareerRoadmap');
const Student = require('../models/Student');
const groq = require('../config/groq');

const callGroq = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a career development expert. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

// POST /student/roadmap/generate
exports.generateRoadmap = async (req, res) => {
    try {
        const { targetRole, timeframe } = req.body;
        if (!targetRole) return res.status(400).json({ success: false, message: 'Target role is required' });

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const currentSkills = (student.aiSkills || []).filter(Boolean);

        const prompt = `Create a detailed career roadmap for a student who wants to become a "${targetRole}" in "${timeframe || '6 months'}".

Current Skills: ${currentSkills.slice(0, 15).join(', ') || 'Basic programming knowledge'}

Return JSON:
{
  "summary": "2-3 sentence overview of the roadmap",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What to achieve",
      "category": "skill|certification|project|experience|education",
      "estimatedDuration": "X weeks",
      "order": 1,
      "resources": [
        { "title": "Resource name", "url": "https://...", "type": "course|book|video|article" }
      ]
    }
  ]
}

Create 8-10 milestones ordered from foundational to advanced, tailored to the target role.`;

        let aiResult;
        try {
            aiResult = await callGroq(prompt);
        } catch (aiErr) {
            console.error('Groq AI error:', aiErr.message);
            return res.status(500).json({ success: false, message: 'AI generation failed: ' + aiErr.message });
        }

        if (!aiResult?.milestones?.length) {
            return res.status(500).json({ success: false, message: 'AI returned an empty roadmap. Please try again.' });
        }

        const sanitizeMilestones = (milestones) => milestones.map((m, idx) => {
            let resources = m.resources || [];
            // If AI returned resources as a JSON string, parse it
            if (typeof resources === 'string') {
                try { resources = JSON.parse(resources); } catch { resources = []; }
            }
            // Ensure each resource is a plain object, not a string
            resources = resources.map(r => {
                if (typeof r === 'string') return { title: r, url: '', resourceType: 'article' };
                return { title: r.title || '', url: r.url || '', resourceType: r.type || r.resourceType || 'article' };
            });
            return { ...m, order: idx, isCompleted: false, resources };
        });

        const roadmap = new CareerRoadmap({
            studentId: student._id,
            targetRole,
            currentSkills,
            timeframe: timeframe || '6 months',
            milestones: sanitizeMilestones(aiResult.milestones),
            summary: aiResult.summary || ''
        });
        await roadmap.save();

        res.status(201).json({ success: true, data: roadmap });
    } catch (err) {
        console.error('Roadmap generation error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }

};

// GET /student/roadmap
exports.getRoadmaps = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const roadmaps = await CareerRoadmap.find({ studentId: student._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: roadmaps });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/roadmap/:id
exports.getRoadmapById = async (req, res) => {
    try {
        const roadmap = await CareerRoadmap.findById(req.params.id);
        if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });
        res.json({ success: true, data: roadmap });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /student/roadmap/:id — toggle milestone or update notes
exports.updateRoadmap = async (req, res) => {
    try {
        const { milestones, isActive } = req.body;

        const roadmap = await CareerRoadmap.findById(req.params.id);
        if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });

        if (milestones) roadmap.milestones = milestones;
        if (typeof isActive === 'boolean') roadmap.isActive = isActive;

        // Recalculate progress
        const total = roadmap.milestones.length;
        const done = roadmap.milestones.filter(m => m.isCompleted).length;
        roadmap.progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

        await roadmap.save();
        res.json({ success: true, data: roadmap });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /student/roadmap/:id
exports.deleteRoadmap = async (req, res) => {
    try {
        await CareerRoadmap.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Roadmap deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
