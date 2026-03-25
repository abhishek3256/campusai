const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate comprehensive AI job analysis using Groq
 */
async function generateJobAnalysis(job, studentProfile, studentResume) {
  try {
    const prompt = `You are an expert career advisor. Analyze this job posting for a student and provide comprehensive insights.

JOB DETAILS:
Title: ${job.title}
Company: ${job.companyId?.companyName || 'Not specified'}
Description: ${job.description}
Requirements: ${job.requirements?.skills?.join(', ') || 'Not specified'}
Skills Required: ${job.requirements?.skills?.join(', ') || 'Not specified'}
CTC: ₹${job.salary?.min || 0} - ₹${job.salary?.max || 0}
Location: ${job.location}
Job Type: ${job.jobType}

STUDENT PROFILE:
Skills: ${studentResume?.skills?.join(', ') || 'Not specified'}
Experience: ${studentResume?.experience?.map(e => `${e.role || ''} at ${e.company || ''}`).join(', ') || 'Fresher'}
Education: ${studentResume?.education?.map(e => `${e.degree || ''} from ${e.institution || ''}`).join(', ') || 'Not specified'}
Projects: ${studentResume?.projects?.map(p => typeof p === 'string' ? p : p.name).join(', ') || 'None'}

Provide a detailed analysis in JSON format with the following structure:
{
  "suitabilityScore": <0-100>,
  "skillMatch": <0-100>,
  "experienceMatch": <0-100>,
  "cultureFit": <0-100>,
  "matchAnalysis": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1", "gap 2", "gap 3"]
  },
  "recommendation": "Overall recommendation paragraph",
  "roleBreakdown": {
    "responsibilities": ["resp 1", "resp 2", "resp 3", "resp 4", "resp 5"],
    "requirements": ["req 1", "req 2", "req 3", "req 4"],
    "dayToDay": "Detailed description of typical day-to-day work"
  },
  "ctc": {
    "base": <amount>,
    "variable": <amount>,
    "bonus": <amount>,
    "stocks": <amount>
  },
  "salaryComparison": "Industry comparison paragraph",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "companyInsights": {
    "founded": <year>,
    "employeeCount": "<count>",
    "growthRate": "<rate>",
    "glassdoorRating": <rating>,
    "trackRecord": "10-year track record paragraph",
    "financialHealth": "Stable/Growing/Uncertain",
    "marketPosition": "Strong/Moderate/Weak",
    "recentNews": ["news 1", "news 2"]
  },
  "careerGrowth": {
    "score": <0-100>,
    "analysis": "Career growth analysis paragraph"
  },
  "learningOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "workLifeBalance": {
    "score": <0-100>,
    "analysis": "Work-life balance analysis"
  },
  "bond": {
    "duration": <years>,
    "amount": <amount>,
    "conditions": "Bond conditions description",
    "fairnessScore": <0-10>,
    "analysis": "Bond fairness analysis"
  },
  "redFlags": ["flag 1", "flag 2"],
  "interviewTips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Be realistic, honest, and provide actionable insights. If information is not available, make educated estimates based on industry standards. Return ONLY valid JSON, no markdown formatting.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = responseText.trim();

    // Remove markdown code blocks (```json or ``` at start and ``` at end)
    if (jsonText.startsWith('```')) {
      // Remove opening ```json or ```
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
      // Remove closing ```
      jsonText = jsonText.replace(/\n?```\s*$/, '');
      jsonText = jsonText.trim();
    }

    const analysis = JSON.parse(jsonText);
    return analysis;
  } catch (error) {
    console.error('AI analysis generation error:', error);
    // Return fallback data
    return {
      suitabilityScore: 65,
      skillMatch: 60,
      experienceMatch: 70,
      cultureFit: 65,
      matchAnalysis: {
        strengths: ["Good educational background", "Relevant technical skills"],
        gaps: ["Limited work experience", "Some required skills missing"]
      },
      recommendation: "This role could be a good opportunity to start your career. Focus on bridging skill gaps through online courses.",
      roleBreakdown: {
        responsibilities: ["Develop and maintain software applications", "Collaborate with team members", "Participate in code reviews"],
        requirements: ["Bachelor's degree in Computer Science", "Programming skills", "Problem-solving abilities"],
        dayToDay: "You'll work on coding tasks, attend team meetings, and contribute to project development."
      },
      ctc: {
        base: job.salary?.min || 300000,
        variable: 50000,
        bonus: 25000,
        stocks: 0
      },
      salaryComparison: "The offered CTC is competitive for entry-level positions in this industry.",
      benefits: ["Health Insurance", "Paid Time Off", "Learning Budget", "Flexible Work Hours"],
      companyInsights: {
        founded: 2010,
        employeeCount: "1000-5000",
        growthRate: "10-15% YoY",
        glassdoorRating: 3.8,
        trackRecord: "The company has shown steady growth over the past decade with a strong market presence.",
        financialHealth: "Stable",
        marketPosition: "Strong",
        recentNews: []
      },
      careerGrowth: {
        score: 70,
        analysis: "Good opportunities for learning and career advancement in this role."
      },
      learningOpportunities: ["Technical skill development", "Mentorship programs", "Industry certifications"],
      workLifeBalance: {
        score: 65,
        analysis: "Moderate work-life balance typical for the industry."
      },
      bond: {
        duration: 0,
        amount: 0,
        conditions: "No service bond",
        fairnessScore: 10,
        analysis: "No bond requirement is favorable for candidates."
      },
      redFlags: [],
      interviewTips: ["Research the company thoroughly", "Prepare examples of your projects", "Practice common technical questions", "Be ready to discuss your skills"]
    };
  }
}

module.exports = { generateJobAnalysis };
