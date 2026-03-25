const Job = require('../models/Job');
const Company = require('../models/Company');

exports.getAllJobs = async (req, res) => {
    try {
        const { title, location, type, minSalary, stream } = req.query;
        let query = { isActive: true };

        if (title) query.title = { $regex: title, $options: 'i' };
        if (location) query.location = { $regex: location, $options: 'i' };
        if (type) query.jobType = type;
        if (minSalary) query['salary.min'] = { $gte: minSalary };
        if (stream) query['requirements.stream'] = stream;

        const count = await Job.countDocuments(query);
        const jobs = await Job.find(query)
            .populate('companyId', 'companyName logo location')
            .sort({ createdAt: -1 });

        res.json({ jobs, count });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('companyId');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        // Ensure user is company owner or admin
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        await Job.deleteOne({ _id: req.params.id });
        res.json({ message: 'Job removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
