const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const avatars = require('../data/avatars');

const generateToken = (id) => {
    return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        console.log('Register Request Body:', req.body);
        let { email, password, role, ...details } = req.body;
        email = email ? email.trim() : '';

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ email, password, role });
        let responseUser = { id: user._id, email, role };

        if (role === 'student') {
            const avatarList = details.gender === 'female' ? avatars.female : avatars.male;
            const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

            await Student.create({
                userId: user._id,
                name: details.name,
                gender: details.gender,
                avatar: randomAvatar,
                phone: details.phone
            });
            responseUser.name = details.name;
            responseUser.avatar = randomAvatar;

        } else if (role === 'company') {
            const randomLogo = avatars.company[Math.floor(Math.random() * avatars.company.length)];

            await Company.create({
                userId: user._id,
                companyName: details.companyName,
                description: details.description,
                industry: details.industry,
                location: details.location,
                logo: randomLogo
            });
            responseUser.companyName = details.companyName;
            responseUser.logo = randomLogo;
        }

        const token = generateToken(user._id);
        res.status(201).json({ success: true, token, user: responseUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email ? email.trim() : '';
        const user = await User.findOne({ email: normalizedEmail });

        if (user && (await user.matchPassword(password))) {
            user.lastLogin = Date.now();
            await user.save();
            const token = generateToken(user._id);

            let nameDetails = {};
            if (user.role === 'student') {
                const student = await Student.findOne({ userId: user._id });
                console.log('Student profile:', student);
                if (student) {
                    nameDetails.name = student.name;
                    nameDetails.avatar = student.avatar;
                    console.log('Student avatar:', student.avatar);
                }
            } else if (user.role === 'company') {
                const company = await Company.findOne({ userId: user._id });
                if (company) {
                    nameDetails.companyName = company.companyName;
                    nameDetails.logo = company.logo;
                }
            }

            const responseUser = {
                id: user._id,
                email: user.email,
                role: user.role,
                ...nameDetails
            };
            console.log('Sending user data to frontend:', responseUser);

            res.json({
                success: true,
                token,
                user: responseUser
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        let profile = null;

        if (user.role === 'student') {
            profile = await Student.findOne({ userId: user._id });
        } else if (user.role === 'company') {
            profile = await Company.findOne({ userId: user._id });
        }

        res.json({ user, profile });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
