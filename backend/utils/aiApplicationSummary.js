const groq = require('../config/groq');

/**
 * Generate AI summary for company when student applies
 */
const generateApplicationSummary = async (studentData, resumeData, jobData) => {
    const systemPrompt = 'You are an expert recruiter who creates concise, insightful candidate summaries for hiring managers. Return only valid JSON.';

    const userPrompt = `
Create a comprehensive candidate summary for a job application.

CANDIDATE INFORMATION:
Name: ${studentData.name}
Education: ${JSON.stringify(resumeData.parsedData?.education || [])}
Experience: ${JSON.stringify(resumeData.parsedData?.experience || [])}
Skills: ${JSON.stringify(resumeData.parsedData?.skills || {})}
Projects: ${JSON.stringify(resumeData.parsedData?.projects || [])}

JOB REQUIREMENTS:
Title: ${jobData.title}
Required Skills: ${JSON.stringify(jobData.requirements?.skills || jobData.skills || [])}
Experience Required: ${jobData.requirements?.experience || jobData.experience || 'Not specified'}
Education Required: ${jobData.requirements?.education || jobData.education || 'Not specified'}

AI RESUME ANALYSIS:
Overall Score: ${resumeData.aiAnalysis?.overallScore || 0}/100
Key Strengths: ${JSON.stringify(resumeData.aiAnalysis?.strengths || [])}
Career Insights: ${JSON.stringify(resumeData.aiAnalysis?.careerInsights || {})}

Generate a JSON response with:
{
  "candidateOverview": "2-3 sentence professional summary of the candidate",
  "keyStrengths": [
    "5-7 specific strengths relevant to this job"
  ],
  "relevantExperience": "Brief summary of most relevant experience",
  "skillHighlights": [
    "Skills that match job requirements with context"
  ],
  "educationSummary": "Education background summary",
  "projectHighlights": [
    "Most relevant projects with brief descriptions"
  ],
  "matchScore": number (0-100, how well candidate matches job),
  "recommendationReason": "Why this candidate should be considered",
  "potentialConcerns": [
    "Any gaps or areas that might need clarification"
  ]
}

Focus on job-relevant information and be objective.
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const summary = JSON.parse(completion.choices[0].message.content);
        return summary;
    } catch (error) {
        console.error('AI summary generation error:', error);
        throw error;
    }
};

/**
 * Prepare skills for verification
 */
const prepareSkillsForVerification = (parsedData, aiAnalysis) => {
    const allSkills = [
        ...(parsedData.skills?.technical || []),
        ...(parsedData.skills?.softSkills || []),
        ...(parsedData.skills?.tools || []),
        ...(parsedData.skills?.languages || [])
    ];

    const skillsBreakdown = aiAnalysis?.skillsBreakdown || [];

    return allSkills.map(skill => {
        const analysis = skillsBreakdown.find(s =>
            s.skill && skill && s.skill.toLowerCase() === skill.toLowerCase()
        );

        return {
            skill: skill,
            claimedProficiency: analysis?.proficiencyLevel || 'Not specified',
            category: analysis?.category || 'General',
            verificationStatus: 'pending',
            evidenceInResume: analysis?.evidenceFound || false,
            contextMentions: analysis?.contextMentions || 0,
            redFlag: {
                isRedFlagged: false,
                reason: '',
                severity: '',
                flaggedAt: null
            }
        };
    });
};

module.exports = {
    generateApplicationSummary,
    prepareSkillsForVerification
};
