import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
    const [role, setRole] = useState('student'); // student, company
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', gender: 'male',
        companyName: '', description: '', industry: '', location: '', phone: ''
    });

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                role
            };

            if (role === 'student') {
                Object.assign(payload, { name: formData.name, gender: formData.gender, phone: formData.phone });
            } else {
                Object.assign(payload, { companyName: formData.companyName, description: formData.description, industry: formData.industry, location: formData.location });
            }

            await api.post('/auth/register', payload);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow dark:shadow-gray-800 transition-colors duration-200">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Create Account</h2>

                <div className="flex justify-center mb-6 space-x-4">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border ${role === 'student' ? 'bg-primary border-primary text-white shadow-md transform scale-105' : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('company')}
                        className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border ${role === 'company' ? 'bg-primary border-primary text-white shadow-md transform scale-105' : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        Company
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="email" type="text" placeholder="Email or Username" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                    <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />

                    {role === 'student' ? (
                        <>
                            <input name="name" type="text" placeholder="Full Name" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                            <input name="phone" type="text" placeholder="Phone" onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                            <select name="gender" onChange={handleChange} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </>
                    ) : (
                        <>
                            <input name="companyName" type="text" placeholder="Company Name" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                            <input name="industry" type="text" placeholder="Industry" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                            <input name="location" type="text" placeholder="Location" required onChange={handleChange} className="input-field w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200" />
                            <textarea name="description" placeholder="Description" onChange={handleChange} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rows-3 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200"></textarea>
                        </>
                    )}

                    <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-blue-600 transition">
                        Register as {role === 'student' ? 'Student' : 'Company'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
