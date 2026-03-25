import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProfileEdit = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        careerGoals: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/student');
                setFormData({
                    name: data.name,
                    phone: data.phone,
                    careerGoals: data.careerGoals
                });
            } catch (error) {
                console.error(error);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/student/update', formData);
            toast.success('Profile updated successfully!');
            // Redirect to dashboard after successful save
            setTimeout(() => {
                navigate('/student/dashboard');
            }, 1000); // Small delay to show the success message
        } catch (error) {
            toast.error('Update failed');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow mt-8 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Career Goals</label>
                    <textarea
                        value={formData.careerGoals}
                        onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                        placeholder="Describe your career goals..."
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        rows="3"
                    />
                </div>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 transition shadow-lg hover:shadow-primary/30">Save Changes</button>
            </form>
        </div>
    );
};

export default ProfileEdit;
