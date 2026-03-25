// Get detailed profile analysis with AI insights
exports.getProfileAnalysis = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const resume = await Resume.findOne({ studentId: student._id }).sort({ uploadedAt: -1 });

        if (!resume || !resume.aiAnalysis) {
            return res.status(404).json({
                success: false,
                message: 'Please upload a resume first to get AI analysis'
            });
        }

        const profileData = {
            overallScore: resume.aiAnalysis.overallScore || 0,
            detailedScores: resume.aiAnalysis.detailedScores || {},
            strengths: resume.aiAnalysis.strengths || [],
            weaknesses: resume.aiAnalysis.weaknesses || [],
            recommendations: resume.aiAnalysis.recommendations || {},
            careerInsights: resume.aiAnalysis.careerInsights || {},
            atsScore: resume.aiAnalysis.atsScore || {},
            keyHighlights: resume.aiAnalysis.keyHighlights || [],
            redFlags: resume.aiAnalysis.redFlags || [],
            industryKeywords: resume.aiAnalysis.industryKeywords || {},
            resumeUrl: resume.fileUrl,
            lastUpdated: resume.uploadedAt
        };

        res.status(200).json({ success: true, data: profileData });
    } catch (error) {
        console.error('Profile analysis error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all applications with detailed information
exports.getApplicationsDetailed = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const applications = await Application.find({ studentId: student._id })
            .populate('jobId')
            .populate('companyId', 'companyName logo')
            .sort({ appliedAt: -1 });

        const detailedApplications = applications.map(app => ({
            _id: app._id,
            jobTitle: app.jobId?.title || 'N/A',
            companyName: app.companyId?.companyName || 'N/A',
            companyLogo: app.companyId?.logo || '',
            location: app.jobId?.location || 'N/A',
            salary: app.jobId?.salary || { min: 0, max: 0 },
            jobType: app.jobId?.jobType || 'N/A',
            workMode: app.jobId?.workMode || 'N/A',
            status: app.status,
            appliedAt: app.appliedAt,
            aiMatchScore: app.aiGeneratedSummary?.matchScore || 0,
            verificationSummary: app.verificationSummary || {},
            interviewSchedule: app.interviewSchedule || null
        }));

        res.status(200).json({
            success: true,
            data: { totalApplications: applications.length, applications: detailedApplications }
        });
    } catch (error) {
        console.error('Applications detailed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get skills analysis with AI insights
exports.getSkillsAnalysis = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const resume = await Resume.findOne({ studentId: student._id }).sort({ uploadedAt: -1 });

        if (!resume || !resume.aiAnalysis) {
            return res.status(404).json({ success: false, message: 'Please upload a resume first' });
        }

        const skillsBreakdown = resume.aiAnalysis.skillsBreakdown || [];

        const skillsData = {
            totalSkills: skillsBreakdown.length,
            skillsBreakdown,
            skillsByCategory: {
                technical: skillsBreakdown.filter(s => s.category === 'Technical'),
                soft: skillsBreakdown.filter(s => s.category === 'Soft'),
                tools: skillsBreakdown.filter(s => s.category === 'Tool'),
                languages: skillsBreakdown.filter(s => s.category === 'Language')
            },
            proficiencyLevels: {
                expert: skillsBreakdown.filter(s => s.proficiencyLevel === 'Expert').length,
                advanced: skillsBreakdown.filter(s => s.proficiencyLevel === 'Advanced').length,
                intermediate: skillsBreakdown.filter(s => s.proficiencyLevel === 'Intermediate').length,
                beginner: skillsBreakdown.filter(s => s.proficiencyLevel === 'Beginner').length
            },
            topSkills: skillsBreakdown.sort((a, b) => b.contextMentions - a.contextMentions).slice(0, 10),
            skillsToImprove: resume.aiAnalysis.recommendations?.skillsToAdd || [],
            industryKeywords: resume.aiAnalysis.industryKeywords || {}
        };

        res.status(200).json({ success: true, data: skillsData });
    } catch (error) {
        console.error('Skills analysis error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
