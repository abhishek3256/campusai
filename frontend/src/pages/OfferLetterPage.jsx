import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Printer, Download, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OfferLetterPage() {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [myOffer, setMyOffer] = useState(null);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef(null);

    useEffect(() => { loadData(); }, [jobId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [jobRes, profileRes] = await Promise.all([
                api.get(`/company/jobs/${jobId}`).catch(() => ({ data: { data: null } })),
                api.get('/student/')
            ]);
            const jobData = jobRes.data?.data || jobRes.data;
            const studentData = profileRes.data;
            setJob(jobData);
            setStudent(studentData);

            // Find this student in selectedStudents
            if (jobData?.selectedStudents?.length) {
                const offer = jobData.selectedStudents.find(s =>
                    s.studentId === studentData?._id || String(s.studentId) === String(studentData?._id)
                );
                setMyOffer(offer);
            }
        } catch (err) { toast.error('Failed to load offer letter'); }
        finally { setLoading(false); }
    };

    const handlePrint = () => window.print();

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

    if (!myOffer && !loading) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center">
                <Award className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Offer Letter Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Results may not have been published yet, or you were not selected for this position.</p>
            </div>
        </div>
    );

    const formattedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const joiningDate = myOffer?.joiningDate
        ? new Date(myOffer.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'To be communicated';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Controls */}
                <div className="print:hidden flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" /> Congratulations! You've been selected
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your offer letter from {job?.companyDisplayName || 'the company'} is ready</p>
                    </div>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                        <Printer className="w-4 h-4" /> Print / Save PDF
                    </button>
                </div>

                {/* Offer Letter */}
                <motion.div ref={printRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl p-10 print:shadow-none print:rounded-none"
                    id="offer-letter">

                    {/* Header */}
                    <div className="border-b-4 border-green-600 pb-6 mb-8 flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{job?.companyDisplayName || 'Company Name'}</h1>
                            {job?.companyWebsite && <p className="text-gray-500 text-sm mt-1">{job.companyWebsite}</p>}
                            {job?.industryType && <p className="text-gray-500 text-sm">{job.industryType}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Date of Issue</p>
                            <p className="font-semibold text-gray-900">{formattedDate}</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-green-700 uppercase tracking-wider">Offer Letter</h2>
                    </div>

                    {/* Recipient */}
                    <div className="mb-6">
                        <p className="text-gray-700 leading-relaxed">Dear <strong>{student?.name || 'Candidate'}</strong>,</p>
                    </div>

                    <div className="mb-6 text-gray-700 leading-relaxed">
                        <p>
                            We are delighted to extend this offer of employment to you at <strong>{job?.companyDisplayName || 'our company'}</strong>. After a thorough evaluation of your skills, academic background, and potential, we are pleased to invite you to join our team.
                        </p>
                    </div>

                    {/* Offer Details Table */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 border-b border-gray-200 pb-2">Offer Details</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Position / Role', value: job?.title },
                                { label: 'Department', value: job?.department || 'As per role' },
                                { label: 'Employment Type', value: job?.employmentType ? job.employmentType.charAt(0).toUpperCase() + job.employmentType.slice(1) : 'Full-time' },
                                { label: 'Location', value: job?.location },
                                { label: 'Annual CTC', value: myOffer?.offerCTC ? `₹ ${myOffer.offerCTC.toLocaleString('en-IN')}` : (job?.salary?.max ? `₹ ${job.salary.max.toLocaleString('en-IN')}` : 'As per discussion') },
                                { label: 'Date of Joining', value: joiningDate },
                            ].filter(r => r.value).map(row => (
                                <div key={row.label} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-600 text-sm">{row.label}</span>
                                    <span className="font-semibold text-gray-900 text-sm">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {job?.bond?.duration && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
                            <strong>Bond Clause:</strong> This offer is subject to a bond of <strong>{job.bond.duration}</strong>. {job.bond.conditions}
                        </div>
                    )}

                    <div className="mb-8 text-gray-700 leading-relaxed text-sm">
                        <p>This offer is contingent upon successful completion of background verification and submission of all required documents. Please confirm your acceptance of this offer within <strong>7 days</strong> of receipt.</p>
                        <p className="mt-3">We look forward to welcoming you to the {job?.companyDisplayName || 'company'} family!</p>
                    </div>

                    {/* Signature area */}
                    <div className="flex justify-between mt-12">
                        <div className="text-center">
                            <div className="border-t-2 border-gray-400 w-40 mb-2" />
                            <p className="text-sm font-semibold text-gray-900">HR Manager</p>
                            <p className="text-xs text-gray-500">{job?.companyDisplayName}</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-400 w-40 mb-2" />
                            <p className="text-sm font-semibold text-gray-900">Candidate Signature</p>
                            <p className="text-xs text-gray-500">{student?.name}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-400">This is a system-generated offer letter. For queries, contact the HR team at {job?.companyDisplayName}.</p>
                        <p className="text-xs text-gray-300 mt-1">Generated via CampusAI Placement Platform</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
