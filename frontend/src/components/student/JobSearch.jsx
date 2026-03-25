import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JobSearch = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/jobs');
            setJobs(data.jobs); // accessing jobs array
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId) => {
        try {
            await api.post(`/jobs/apply/${jobId}`);
            toast.success('Applied successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Application failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">Find Jobs</h1>

            {loading ? (
                <div className="text-center">Loading jobs...</div>
            ) : (
                <div className="grid gap-6">
                    {jobs.map(job => (
                        <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                                <p className="text-gray-600 mb-2">{job.companyId?.companyName} • {job.location}</p>
                                <div className="flex gap-2 mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{job.jobType}</span>
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">{job.salary?.min}-{job.salary?.max} INR</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {job.requirements?.skills?.map((skill, i) => (
                                        <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{skill}</span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleApply(job._id)}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                            >
                                Apply
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobSearch;
