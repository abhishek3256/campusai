const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const {
    generateJobDescription,
    generateCompanyDescription,
    generateEligibilityRequirements,
    generateOfferLetter,
    generateJoiningLetter
} = require('../utils/aiServices');

// ── Update Job ────────────────────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        const updated = await Job.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: false }
        );
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── Delete Job ────────────────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found or not yours' });

        await Job.findByIdAndDelete(req.params.id);

        // Remove from company.jobs using $pull (atomic, no array load needed)
        await Company.findByIdAndUpdate(company._id, { $pull: { jobs: job._id } });

        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (err) {
        console.error('Delete job error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCompanyProfile = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id }).populate('userId', '-password');
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateCompanyProfile = async (req, res) => {
    try {
        const company = await Company.findOneAndUpdate(
            { userId: req.user._id },
            { $set: req.body },
            { new: true }
        );
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.postJob = async (req, res) => {
    try {
        console.log('Post Job Request Body:', req.body);
        const company = await Company.findOne({ userId: req.user._id });

        if (!company) {
            console.error('Company profile not found for user:', req.user._id);
            return res.status(404).json({ message: 'Company profile not found' });
        }

        const jobData = { ...req.body, companyId: company._id };
        console.log('Creating Job with Data:', jobData);

        const job = await Job.create(jobData);

        company.jobs.push(job._id);
        await company.save();

        res.status(201).json(job);
    } catch (error) {
        console.error('Post Job Error:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

exports.getJobs = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInternalApplicants = async (req, res) => {
    try {
        const { jobId } = req.params;
        const applications = await Application.find({ jobId })
            .populate('studentId')
            .sort({ aiMatchScore: -1 }); // AI sorted
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createAIJobDesc = async (req, res) => {
    try {
        const desc = await generateJobDescription(req.body);
        res.json({ description: desc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAICompanyDesc = async (req, res) => {
    try {
        const desc = await generateCompanyDescription(req.body);
        res.json({ description: desc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAIEligibility = async (req, res) => {
    try {
        const requirements = await generateEligibilityRequirements(req.body);
        res.json({ requirements });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateOfferLetterEndpoint = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id).populate('studentId').populate('jobId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const offerDetails = req.body.offerDetails || { salary: 'As per industry standards', startDate: 'Immediately' };
        
        const letter = await generateOfferLetter(application.studentId, { ...application.jobId.toObject(), company: 'Your Company' }, offerDetails);
        application.aiGeneratedOfferLetter = letter;
        application.status = 'offered'; 
        await application.save();
        
        res.json({ success: true, letter, data: application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.generateJoiningLetterEndpoint = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id).populate('studentId').populate('jobId');
        const company = await Company.findOne({ userId: req.user._id });
        
        const details = req.body.details || { manager: 'HR Dept', time: '9:00 AM', date: 'TBD', location: 'Office' };
        const jobWithCompany = { ...application.jobId.toObject(), companyName: company.companyName };
        
        const letter = await generateJoiningLetter(application.studentId, jobWithCompany, details);
        application.aiGeneratedJoiningLetter = letter;
        application.status = 'joined'; 
        await application.save();
        
        res.json({ success: true, letter, data: application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Get applicant details with AI summary
 */
exports.getApplicantDetails = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId)
            .populate('studentId', 'name email phone avatar')
            .populate('jobId', 'title requirements skills')
            .populate({
                path: 'studentId',
                populate: {
                    path: 'resume',
                    model: 'Resume'
                }
            });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Verify/reject individual skill
 */
exports.verifySkill = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { skillIndex, status, notes } = req.body;
        // status: 'verified', 'rejected', 'needs-review'

        const application = await Application.findById(applicationId);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Update skill verification status
        application.skillsVerification[skillIndex].verificationStatus = status;
        application.skillsVerification[skillIndex].verifiedBy = req.user._id;
        application.skillsVerification[skillIndex].verifiedAt = new Date();
        application.skillsVerification[skillIndex].companyNotes = notes || '';

        // Red flag if rejected
        if (status === 'rejected') {
            application.skillsVerification[skillIndex].redFlag = {
                isRedFlagged: true,
                reason: notes || 'Skill could not be verified',
                severity: 'medium',
                flaggedAt: new Date()
            };
        }

        // Update verification summary
        const verifiedCount = application.skillsVerification.filter(s => s.verificationStatus === 'verified').length;
        const rejectedCount = application.skillsVerification.filter(s => s.verificationStatus === 'rejected').length;
        const redFlaggedCount = application.skillsVerification.filter(s => s.redFlag.isRedFlagged).length;

        application.verificationSummary.verifiedSkills = verifiedCount;
        application.verificationSummary.rejectedSkills = rejectedCount;
        application.verificationSummary.redFlaggedSkills = redFlaggedCount;
        application.verificationSummary.verificationScore = Math.round((verifiedCount / application.skillsVerification.length) * 100);

        // Check if verification complete
        const allVerified = application.skillsVerification.every(s => s.verificationStatus !== 'pending');
        if (allVerified) {
            application.verificationSummary.overallStatus = 'completed';
            application.verificationSummary.completedAt = new Date();

            // Update application status based on verification
            if (redFlaggedCount > 3 || application.verificationSummary.verificationScore < 50) {
                application.status = 'verification-failed';
            } else {
                application.status = 'under-review';
            }
        }

        application.updatedAt = new Date();
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Skill verification updated',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Bulk verify/reject skills
 */
exports.bulkVerifySkills = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { verifications } = req.body;
        const application = await Application.findById(applicationId);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        verifications.forEach(({ skillIndex, status, notes }) => {
            application.skillsVerification[skillIndex].verificationStatus = status;
            application.skillsVerification[skillIndex].verifiedBy = req.user._id;
            application.skillsVerification[skillIndex].verifiedAt = new Date();
            application.skillsVerification[skillIndex].companyNotes = notes || '';
            if (status === 'rejected') {
                application.skillsVerification[skillIndex].redFlag = {
                    isRedFlagged: true, reason: notes || 'Skill could not be verified', severity: 'medium', flaggedAt: new Date()
                };
            }
        });

        const verifiedCount = application.skillsVerification.filter(s => s.verificationStatus === 'verified').length;
        const rejectedCount = application.skillsVerification.filter(s => s.verificationStatus === 'rejected').length;
        const redFlaggedCount = application.skillsVerification.filter(s => s.redFlag.isRedFlagged).length;

        application.verificationSummary.verifiedSkills = verifiedCount;
        application.verificationSummary.rejectedSkills = rejectedCount;
        application.verificationSummary.redFlaggedSkills = redFlaggedCount;
        application.verificationSummary.verificationScore = Math.round((verifiedCount / application.skillsVerification.length) * 100);
        application.verificationSummary.overallStatus = 'completed';
        application.verificationSummary.completedAt = new Date();
        if (redFlaggedCount > 3 || application.verificationSummary.verificationScore < 50) {
            application.status = 'verification-failed';
        } else { application.status = 'under-review'; }

        await application.save();
        res.status(200).json({ success: true, message: 'Bulk verification completed', data: application });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── NEW: Get single job detail ────────────────────────────────────────────────
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('companyId', 'name logo website');
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.json({ success: true, data: job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── NEW: Auto-shortlist based on eligibility ─────────────────────────────────
exports.autoShortlist = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        const applications = await Application.find({ jobId: job._id })
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

        const minCGPA = job.eligibility?.minCGPA || 0;
        const branches = job.eligibility?.branches || [];
        const passingYear = job.eligibility?.passingYear || 0;

        const shortlisted = [];
        for (const app of applications) {
            const s = app.studentId;
            const cgpa = s?.cgpa || 0;
            const branch = s?.branch || s?.department || '';
            const year = s?.passingYear || s?.graduationYear || 0;

            const cgpaOk = cgpa >= minCGPA;
            const branchOk = branches.length === 0 || branches.some(b => branch.toLowerCase().includes(b.toLowerCase()));
            const yearOk = passingYear === 0 || year === passingYear;

            if (cgpaOk && branchOk && yearOk) {
                shortlisted.push(s._id);
                await Application.findByIdAndUpdate(app._id, { status: 'shortlisted' });
            }
        }

        job.shortlistedStudents = shortlisted;
        job.recruitmentStage = 'shortlisting';
        await job.save();

        res.json({ success: true, message: `${shortlisted.length} students shortlisted`, data: { count: shortlisted.length } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── NEW: Publish final results ─────────────────────────────────────────────
exports.publishResults = async (req, res) => {
    try {
        const { selectedStudents } = req.body; // [{ studentId, offerCTC, joiningDate }]
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        job.selectedStudents = selectedStudents.map(s => ({
            studentId: s.studentId,
            offerCTC: s.offerCTC || job.salary?.max || 0,
            joiningDate: s.joiningDate || null,
            offerStatus: 'pending'
        }));
        job.recruitmentStage = 'results';
        await job.save();

        // Update application status for selected students
        for (const s of selectedStudents) {
            await Application.updateOne({ jobId: job._id, studentId: s.studentId }, { status: 'selected' });
        }

        res.json({ success: true, message: 'Results published', data: job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
