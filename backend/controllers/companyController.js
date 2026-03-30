const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const {
    generateJobDescription,
    generateCompanyDescription,
    generateEligibilityRequirements,
    generateOfferLetter,
    generateJoiningLetter,
    generateEmploymentLetter
} = require('../utils/aiServices');

// ── Helper: map overallStatus to legacy status ─────────────────────────────────
const OVERALL_TO_LEGACY = {
    'Application Pending': 'pending',
    'Application Under Review': 'under-review',
    'Application Shortlisted': 'shortlisted',
    'Application Rejected': 'rejected',
    'In Progress': 'shortlisted',
    'Selected': 'accepted',
    'Offer Accepted': 'accepted',
    'Offer Rejected': 'rejected',
    'Joined': 'joined',
    'Withdrawn': 'rejected'
};

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
        const { status, notes, stage } = req.body;

        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Support both overallStatus (new) and status (legacy)
        const isOverallStatus = [
            'Application Pending', 'Application Under Review', 'Application Shortlisted',
            'Application Rejected', 'In Progress', 'Selected', 'Offer Accepted',
            'Offer Rejected', 'Joined', 'Withdrawn'
        ].includes(status);

        if (isOverallStatus) {
            application.overallStatus = status;
            if (OVERALL_TO_LEGACY[status]) application.status = OVERALL_TO_LEGACY[status];
        } else if (status) {
            application.status = status;
        }

        let newStage = stage;
        if (!newStage) {
            const stageMap = {
                'under-review': 'under_review', 'Application Under Review': 'under_review',
                'shortlisted': 'under_review', 'Application Shortlisted': 'under_review',
                'technical-interview': 'technical_interview',
                'hr-interview': 'hr_interview',
                'offered': 'offer_sent',
                'accepted': 'selected', 'Selected': 'selected',
                'documents-submitted': 'document_verification',
                'documents-verified': 'documents_verified',
                'joined': 'joined', 'Joined': 'joined',
                'rejected': 'rejected', 'Application Rejected': 'rejected'
            };
            newStage = stageMap[status];
        }

        if (newStage && newStage !== application.currentStage) {
            application.currentStage = newStage;
            if (newStage === 'rejected') {
                application.rejectedAt = new Date();
                application.rejectionReason = notes || 'Rejected during review';
            }
            if (newStage === 'joined') application.joinedAt = new Date();
        }

        application.statusHistory.push({
            stage: newStage || application.currentStage,
            status: status,
            timestamp: new Date(),
            updatedBy: req.user._id,
            notes: notes || `Status updated to ${status}`
        });

        application.updatedAt = new Date();
        await application.save();
        res.json({ success: true, data: application });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── Interview Tracking ─────────────────────────────────
exports.scheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { roundName, scheduledDate, scheduledTime, mode, meetingLink, location, interviewerName, interviewerEmail } = req.body;
        
        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const roundNumber = application.interviewRounds.length + 1;
        application.interviewRounds.push({
            roundNumber,
            roundName,
            scheduledDate,
            scheduledTime,
            mode,
            meetingLink,
            location,
            interviewerName,
            interviewerEmail,
            status: 'scheduled'
        });
        
        // Update stage based on round name if needed
        let newStage = application.currentStage;
        if (roundName === 'Technical Interview') newStage = 'technical_interview';
        if (roundName === 'Managerial Interview') newStage = 'managerial_interview';
        if (roundName === 'HR Interview') newStage = 'hr_interview';
        
        if (newStage !== application.currentStage) {
            application.currentStage = newStage;
            application.statusHistory.push({
                stage: newStage,
                timestamp: new Date(),
                updatedBy: req.user._id,
                notes: `Scheduled ${roundName}`
            });
            
            // Map legacy status
            if (newStage === 'technical_interview') application.status = 'technical-interview';
            if (newStage === 'hr_interview') application.status = 'hr-interview';
        }
        
        await application.save();
        res.status(200).json({ success: true, interviewRounds: application.interviewRounds, currentStage: application.currentStage, status: application.status });
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateInterviewResult = async (req, res) => {
    try {
        const { id, roundId } = req.params;
        const { result, feedback } = req.body;
        
        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const round = application.interviewRounds.id(roundId);
        if (!round) return res.status(404).json({ message: 'Interview round not found' });
        
        round.result = result;
        round.feedback = feedback;
        round.status = 'completed';
        round.completedAt = new Date();
        
        if (result === 'fail') {
            application.currentStage = 'rejected';
            application.status = 'rejected';
            application.rejectedAt = new Date();
            application.rejectionReason = feedback || `Failed at ${round.roundName}`;
            application.statusHistory.push({
                stage: 'rejected',
                timestamp: new Date(),
                updatedBy: req.user._id,
                notes: application.rejectionReason
            });
        }
        
        await application.save();
        res.status(200).json({ success: true, interviewRounds: application.interviewRounds, currentStage: application.currentStage });
    } catch (error) {
        console.error('Update interview result error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateOfferLetterEndpoint = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('studentId')
            .populate({ path: 'jobId', populate: { path: 'companyId' } })
            .populate('companyId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        const { ctc, joiningDate, designation, department } = req.body;
        const studentName = application.studentId?.name || 'Candidate';
        const jobTitle = designation || application.jobId?.title || 'Position';
        const companyName = application.companyId?.companyName || 'The Company';
        const finalCtc = ctc || application.jobId?.salary?.max || 0;
        const finalJoiningDate = joiningDate || 'To be decided';

        const letter = await generateOfferLetter(studentName, jobTitle, companyName, finalCtc, finalJoiningDate);

        // Update legacy offer letter
        application.offerLetter = {
            generatedAt: new Date(),
            sentAt: new Date(),
            ctc: finalCtc,
            joiningDate: finalJoiningDate ? new Date(finalJoiningDate) : undefined,
            aiGeneratedContent: letter
        };

        // Also store in pipelineProgress stageResults if Offer Letter stage exists
        if (application.pipelineProgress?.stageResults?.length > 0) {
            const offerIdx = application.pipelineProgress.stageResults.findIndex(
                s => s.stageName === 'Offer Letter'
            );
            if (offerIdx !== -1) {
                application.pipelineProgress.stageResults[offerIdx].generatedLetter = {
                    letterType: 'offer',
                    letterContent: letter,
                    generatedAt: new Date(),
                    sentAt: new Date(),
                    offerDetails: { ctc: finalCtc, joiningDate: finalJoiningDate, designation: jobTitle, department: department || application.jobId?.department }
                };
                application.pipelineProgress.stageResults[offerIdx].status = 'in_progress';
                application.pipelineProgress.stageResults[offerIdx].startedAt = new Date();
            }
        }

        application.currentStage = 'offer_sent';
        application.status = 'offered';
        application.overallStatus = 'In Progress';
        application.statusHistory.push({
            stage: 'offer_sent',
            status: 'In Progress',
            timestamp: new Date(),
            updatedBy: req.user._id,
            notes: 'AI Offer letter generated and sent to student'
        });

        application.markModified('pipelineProgress');
        await application.save();
        res.json({ success: true, letter, data: application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.generateJoiningLetterEndpoint = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('studentId')
            .populate({ path: 'jobId', populate: { path: 'companyId' } })
            .populate('companyId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        const { joiningDate, reportingTime, reportingLocation, details } = req.body;
        const studentName = application.studentId?.name || 'Candidate';
        const jobTitle = application.jobId?.title || 'Position';
        const companyName = application.companyId?.companyName || 'The Company';

        const finalJoiningDate = joiningDate || application.offerLetter?.joiningDate || 'Your confirmed joining date';
        const finalTime = reportingTime || details?.time || '10:00 AM';
        const finalLocation = reportingLocation || details?.location || 'Company Headquarters';

        const letter = await generateJoiningLetter(studentName, jobTitle, companyName, finalJoiningDate, finalTime, finalLocation);

        application.joiningLetter = {
            generatedAt: new Date(),
            sentAt: new Date(),
            joiningDate: finalJoiningDate ? new Date(finalJoiningDate) : undefined,
            reportingTime: finalTime,
            reportingLocation: finalLocation,
            aiGeneratedContent: letter
        };

        // Also store in pipelineProgress stageResults if Joining Letter stage exists
        if (application.pipelineProgress?.stageResults?.length > 0) {
            const joinIdx = application.pipelineProgress.stageResults.findIndex(
                s => s.stageName === 'Joining Letter'
            );
            if (joinIdx !== -1) {
                application.pipelineProgress.stageResults[joinIdx].generatedLetter = {
                    letterType: 'joining',
                    letterContent: letter,
                    generatedAt: new Date(),
                    sentAt: new Date(),
                    offerDetails: { joiningDate: finalJoiningDate, reportingLocation: finalLocation, reportingTime: finalTime }
                };
                application.pipelineProgress.stageResults[joinIdx].status = 'in_progress';
                application.pipelineProgress.stageResults[joinIdx].startedAt = new Date();
            }
        }

        application.currentStage = 'joining_letter_issued';
        application.statusHistory.push({
            stage: 'joining_letter_issued',
            status: 'In Progress',
            timestamp: new Date(),
            updatedBy: req.user._id,
            notes: 'AI Joining letter generated and issued to student'
        });

        application.markModified('pipelineProgress');
        await application.save();
        res.json({ success: true, letter, data: application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── NEW: Generate Employment Letter ──────────────────────────────────────────
exports.generateEmploymentLetterEndpoint = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('studentId')
            .populate({ path: 'jobId', populate: { path: 'companyId' } })
            .populate('companyId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        const { employeeId } = req.body;
        const studentName = application.studentId?.name || 'Employee';
        const jobTitle = application.jobId?.title || 'Position';
        const companyName = application.companyId?.companyName || 'The Company';
        const joiningDate = application.offerLetter?.joiningDate?.toLocaleDateString('en-IN') ||
            application.joinedAt?.toLocaleDateString('en-IN') || 'Date of Joining';

        const letter = await generateEmploymentLetter(studentName, jobTitle, companyName, joiningDate, employeeId);

        // Store in pipelineProgress stageResults if Letter of Employment stage exists
        if (application.pipelineProgress?.stageResults?.length > 0) {
            const empIdx = application.pipelineProgress.stageResults.findIndex(
                s => s.stageName === 'Letter of Employment'
            );
            if (empIdx !== -1) {
                application.pipelineProgress.stageResults[empIdx].generatedLetter = {
                    letterType: 'employment',
                    letterContent: letter,
                    generatedAt: new Date(),
                    sentAt: new Date()
                };
                application.pipelineProgress.stageResults[empIdx].status = 'passed';
                application.pipelineProgress.stageResults[empIdx].completedAt = new Date();
            }
        }

        application.statusHistory.push({
            stage: 'employment_letter_issued',
            status: 'Joined',
            timestamp: new Date(),
            updatedBy: req.user._id,
            notes: 'AI Employment letter generated'
        });

        application.markModified('pipelineProgress');
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

// ── Documents ─────────────────────────────────
exports.approveDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentId, status, remarks } = req.body; // status: 'approved', 'rejected'
        
        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const doc = application.documents.id(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        doc.companyVerification = {
            status,
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
            remarks
        };
        doc.status = status === 'approved' ? 'verified' : 'rejected';
        
        const allApproved = application.documents.every(d => d.companyVerification?.status === 'approved' || d.status === 'verified');
        if (allApproved && application.documents.length > 0) {
            application.currentStage = 'documents_verified';
            application.status = 'documents-verified';
            application.statusHistory.push({
                stage: 'documents_verified',
                timestamp: new Date(),
                updatedBy: req.user._id,
                notes: 'All documents verified'
            });
        }
        
        await application.save();
        res.json({ success: true, documents: application.documents, currentStage: application.currentStage });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
