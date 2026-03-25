const groq = require('../config/groq');

const matchSkills = async (jobSkills, studentSkills) => {
    try {
        const prompt = `
        Job Skills Required: ${JSON.stringify(jobSkills)}
        Student Skills: ${JSON.stringify(studentSkills)}
        
        Task:
        1. Calculate a match percentage (0-100) based on how well the student skills cover the job requirements.
        2. List the matching skills.
        3. List the missing skills that are required for the job.
        
        Return ONLY valid JSON in this format:
        {
            "matchPercentage": number,
            "matchingSkills": [string],
            "missingSkills": [string],
            "reasoning": "Brief explanation"
        }`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an expert HR AI assistant. Analyze skill compatibility accurately.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
        console.error('Skill Matching Error:', error);
        return { matchPercentage: 0, matchingSkills: [], missingSkills: jobSkills, reasoning: "Error in calculation" };
    }
};

module.exports = { matchSkills };
