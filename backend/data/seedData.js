const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const connectDB = require('../config/db');
const avatars = require('./avatars');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('Clearing database...');
        await User.deleteMany({});
        await Student.deleteMany({});
        await Company.deleteMany({});
        await Job.deleteMany({});
        // await Application.deleteMany({}); // Optional

        console.log('Creating Users...');

        // Admin
        const adminUser = await User.create({
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            isVerified: true
        });

        // Company
        const companyUser = await User.create({
            email: 'company@test.com',
            password: 'password123',
            role: 'company',
            isVerified: true
        });

        const companyProfile = await Company.create({
            userId: companyUser._id,
            companyName: 'TechCorp India',
            description: 'Leading tech solutions provider.',
            industry: 'IT Services',
            location: 'Bangalore',
            size: '51-200'
        });

        // Student 1
        const studentUser1 = await User.create({
            email: 's',
            password: 'password123',
            role: 'student',
            isVerified: true
        });

        await Student.create({
            userId: studentUser1._id,
            name: 'Rahul Sharma',
            gender: 'male',
            avatar: avatars.male[0],
            phone: '9876543210',
            aiSkills: ['JavaScript', 'React', 'Node.js'],
            profileStrengthScore: 75
        });

        console.log('Creating Jobs...');

        await Job.create({
            companyId: companyProfile._id,
            title: 'Frontend Developer Intern',
            description: 'We are looking for a React developer.',
            jobType: 'internship',
            workMode: 'remote',
            requirements: {
                skills: ['React', 'CSS', 'JavaScript'],
                experience: '0-1 years'
            },
            salary: { min: 10000, max: 20000 },
            location: 'Remote',
            isActive: true
        });

        await Job.create({
            companyId: companyProfile._id,
            title: 'Full Stack Engineer',
            description: 'MERN stack developer needed.',
            jobType: 'full-time',
            workMode: 'on-site',
            requirements: {
                skills: ['React', 'Node.js', 'MongoDB'],
                experience: '2+ years'
            },
            salary: { min: 600000, max: 1200000 },
            location: 'Bangalore',
            isActive: true
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
