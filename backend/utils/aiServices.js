const groq = require('../config/groq');

const generateJobDescription = async (data) => {
    const prompt = `
    Create a professional job description for:
    Title: ${data.title}
    Skills: ${data.skills}
    Experience: ${data.experience}
    Industry: ${data.industry || 'Tech'}
    
    Include:
    1. About the Role
    2. Key Responsibilities
    3. Requirements
    4. Benefits
    
    Format: Return as a JSON object with a single field 'description' containing the full markdown formatted text.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content).description;
};

const generateCompanyDescription = async (data) => {
    const prompt = `
    Create a professional and engaging company description/bio for a job posting.
    Company Name: ${data.companyName}
    Industry: ${data.industry || 'General'}
    Job Title being posted: ${data.title || 'Various'}
    
    Make it sound attractive to potential candidates. Keep it concise (approx 150-200 words).
    Format: Return as a JSON object with a single field 'description' containing the text.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content).description;
};

const generateEligibilityRequirements = async (data) => {
    const prompt = `
    Generate professional academic and eligibility requirements for a job posting.
    Title: ${data.title}
    Min CGPA: ${data.minCGPA || 'Not specified'}
    Branches: ${data.branches || 'Not specified'}
    
    Provide a paragraph outlining the core academic expectations, behavioral traits, and extra-curricular expectations or good-to-haves that align with this role perfectly.
    Format: Return as a JSON object with a single field 'requirements' containing the markdown formatted text.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content).requirements;
};

const generateCoverLetter = async (student, job) => {
    const prompt = `
    Generate a cover letter for:
    Student Name: ${student.name}
    Skills: ${JSON.stringify(student.skills)}
    Experience: ${JSON.stringify(student.experience)}
    
    Applying for Job: ${job.title} at ${job.company}
    
    Make it professional, personalized to the job, and concise (approx 250 words).
    Return as JSON: { "coverLetter": "text..." }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content).coverLetter;
};

const generateOfferLetter = async (studentName, jobTitle, companyName, ctc, joiningDate) => {
    const prompt = `
    Generate a professional offer letter with the following details:

    COMPANY: ${companyName}
    STUDENT: ${studentName}
    POSITION: ${jobTitle}
    CTC: ₹${ctc} per annum
    JOINING DATE: ${joiningDate}

    Include:
    - Formal greeting
    - Position details and responsibilities
    - Compensation breakdown (base + benefits)
    - Joining date and location
    - Terms and conditions
    - Acceptance deadline
    - Contact information
    - Professional closing

    Format as a formal business letter.
    Return ONLY the letter content, no markdown format (no wrapping \`\`\`).
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7
    });
    return completion.choices[0].message.content;
};

const generateJoiningLetter = async (studentName, jobTitle, companyName, joiningDate, reportingTime, reportingLocation) => {
    const prompt = `
    Generate a joining letter for:

    STUDENT: ${studentName}
    POSITION: ${jobTitle}
    COMPANY: ${companyName}
    JOINING DATE: ${joiningDate}
    REPORTING TIME: ${reportingTime}
    LOCATION: ${reportingLocation}

    Include:
    - Warm welcome message
    - Joining date, time, and location
    - Documents to bring on first day
    - Dress code
    - Contact person details
    - Parking/transportation info if applicable
    - First day schedule overview

    Make it friendly yet professional.
    Return ONLY the letter content, no markdown format (no wrapping \`\`\`).
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7
    });
    return completion.choices[0].message.content;
};

const generateCareerGuidance = async (profile) => {
    const prompt = `
    Student profile:
    Skills: ${JSON.stringify(profile.skills)}
    Education: ${JSON.stringify(profile.education)}
    Career Goals: ${profile.careerGoals}
    
    Provide:
    1. Career Roadmap (steps)
    2. Skills to Learn
    3. Recommended Courses/Certifications
    4. Timeline estimate
    
    Return separate fields in JSON.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

const generateInterviewQuestions = async (jobTitle, skills) => {
    const prompt = `
    Generate 10 interview questions for position: ${jobTitle}
    requiring skills: ${skills}
    
    Include:
    - 5 Technical
    - 3 Behavioral
    - 2 Situational
    
    Return as JSON: { "questions": [ { "type": "Technical", "question": "..." }, ... ] }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content).questions;
};

const detectResumeFraud = async (resumeText1, resumeText2) => {
    const prompt = `
    Compare these two resume texts for plagiarism or suspicious similarity:
    Resume 1: ${resumeText1.substring(0, 5000)}
    Resume 2: ${resumeText2.substring(0, 5000)}
    
    Return JSON:
    {
        "similarityScore": number (0-100),
        "isDuplicate": boolean,
        "suspiciousSections": [string]
    }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: 'You are a fraud detection AI.' }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

const calculateProfileStrength = async (profile) => {
    const prompt = `
    Analyze student profile:
    Education: ${JSON.stringify(profile.education)}
    Skills: ${JSON.stringify(profile.skills)}
    Projects: ${JSON.stringify(profile.projects)}
    Experience: ${JSON.stringify(profile.experience)}
    
    Score profile strength (0-100).
    Provide reasoning and improvement suggestions.
    Return JSON: { "score": number, "reasoning": "...", "suggestions": ["..."] }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
};

const recommendJobs = async (studentProfile, jobsList) => {
    // For large job lists, we would typically vector search first.
    // Here we assume a filtered list is passed (e.g. top 20 relevant jobs).
    const prompt = `
   Student Profile: ${JSON.stringify(studentProfile)}
   
   Available Jobs: ${JSON.stringify(jobsList)}
   
   Rank the top 5 most suitable jobs for this student.
   Return JSON: { "recommendedJobIds": ["id1", "id2"], "reasoning": "..." }
   `;
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
}

const generateEmploymentLetter = async (studentName, jobTitle, companyName, joiningDate, employeeId) => {
    const prompt = `
Generate a professional Letter of Employment for:

COMPANY: ${companyName}
EMPLOYEE NAME: ${studentName}
DESIGNATION: ${jobTitle}
DATE OF JOINING: ${joiningDate}
EMPLOYEE ID: ${employeeId || 'To be assigned'}
DATE: ${new Date().toLocaleDateString('en-IN')}

This letter confirms employment and includes:
- Official statement of employment
- Employee name, designation, and department
- Date of joining
- Confirmation that the employee is a full-time employee in good standing
- Statement for bank/visa/external verification purposes
- Company seal/signatory information

Make it formal, official, and suitable for submission to banks, embassies, or other institutions.
Return ONLY the letter content, no markdown format (no wrapping \`\`\`).
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5
    });
    return completion.choices[0].message.content;
};

module.exports = {
    generateJobDescription,
    generateCoverLetter,
    generateOfferLetter,
    generateJoiningLetter,
    generateEmploymentLetter,
    generateCareerGuidance,
    generateInterviewQuestions,
    detectResumeFraud,
    calculateProfileStrength,
    recommendJobs,
    generateCompanyDescription,
    generateEligibilityRequirements
};
