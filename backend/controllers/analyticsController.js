const Application = require('../models/Application');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

// Admin: GET /admin/analytics — placement stats overview
exports.getPlacementStats = async (req, res) => {
    try {
        // Total applications, placements (status: offered/hired)
        const totalApplications = await Application.countDocuments();
        const selectedApplications = await Application.countDocuments({ status: { $in: ['offered', 'selected', 'hired'] } });
        const totalStudents = await Student.countDocuments();
        const totalJobs = await Job.countDocuments();
        const totalCompanies = await Company.countDocuments();

        // Applications per status
        const statusBreakdown = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Applications per job (top 10)
        const topJobs = await Application.aggregate([
            { $group: { _id: '$jobId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
            { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
            { $project: { jobTitle: '$job.title', company: '$job.company', count: 1 } }
        ]);

        // Monthly application trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyTrend = await Application.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalApplications,
                selectedApplications,
                totalStudents,
                totalJobs,
                totalCompanies,
                placementRate: totalStudents > 0 ? Math.round((selectedApplications / totalStudents) * 100) : 0,
                statusBreakdown,
                topJobs,
                monthlyTrend
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: GET /admin/analytics/company-visits — company visit history
exports.getCompanyVisitHistory = async (req, res) => {
    try {
        const companies = await Company.find({}).populate('userId', 'name');
        const companyStats = await Promise.all(companies.map(async (company) => {
            const jobsPosted = await Job.countDocuments({ company: company._id });
            const totalHired = await Application.countDocuments({ companyId: company._id, status: { $in: ['offered', 'selected', 'hired'] } });
            return {
                companyId: company._id,
                name: company.name || company.userId?.name,
                jobsPosted,
                totalHired
            };
        }));
        res.json({ success: true, data: companyStats.sort((a, b) => b.jobsPosted - a.jobsPosted) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Company: GET /company/ranked-applicants/:jobId — AI-ranked applicants
exports.getRankedApplicants = async (req, res) => {
    try {
        const applications = await Application.find({ jobId: req.params.jobId })
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
            .sort({ aiMatchScore: -1 });

        res.json({ success: true, data: applications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
