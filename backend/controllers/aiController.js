const aiServices = require('../utils/aiServices');
const { parseResume } = require('../utils/resumeParser');
const { matchSkills } = require('../utils/skillMatcher');
const { verifyDocument } = require('../utils/documentVerifier');
const groq = require('../config/groq');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Resume = require('../models/Resume');

const callGroqAPI = async (userPrompt, systemPrompt) => {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });
  return JSON.parse(completion.choices[0].message.content);
};

exports.parseResumeHandler = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const parsedData = await parseResume(req.file);
        res.json({ success: true, data: parsedData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.skillMatchHandler = async (req, res) => {
    try {
        const { jobSkills, studentSkills } = req.body;
        const result = await matchSkills(jobSkills, studentSkills);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateJobDescriptionHandler = async (req, res) => {
    try {
        const description = await aiServices.generateJobDescription(req.body);
        res.json({ success: true, description });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateCoverLetterHandler = async (req, res) => {
    try {
        const { student, job } = req.body;
        const letter = await aiServices.generateCoverLetter(student, job);
        res.json({ success: true, coverLetter: letter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateOfferLetterHandler = async (req, res) => {
    try {
        const { student, job, offerDetails } = req.body;
        const letter = await aiServices.generateOfferLetter(student, job, offerDetails);
        res.json({ success: true, offerLetter: letter });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.careerGuidanceHandler = async (req, res) => {
    try {
        const guidance = await aiServices.generateCareerGuidance(req.body);
        res.json({ success: true, data: guidance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.interviewQuestionsHandler = async (req, res) => {
    try {
        const { title, skills } = req.body;
        const questions = await aiServices.generateInterviewQuestions(title, skills);
        res.json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.profileScoreHandler = async (req, res) => {
    try {
        const scoreData = await aiServices.calculateProfileStrength(req.body);
        res.json({ success: true, data: scoreData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyDocumentHandler = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        // In a real app, perform OCR here. For now, we assume text is passed in body as 'ocrText' dev shortcut
        // OR we use a pdf parser if it's a PDF.
        // Let's rely on the body 'ocrText' for simplicity or a simple text extractor if pdf.

        let text = req.body.ocrText || "";
        // Simple fallback if no text provided but file is pdf
        // logic to extract text...

        const verification = await verifyDocument(text, req.body.documentType);
        res.json({ success: true, data: verification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- NEW 5 AI FEATURES CONTROLLERS ---

exports.predictApplicationSuccess = async (req, res) => {
  try {
    const { studentId, jobId, jobRole } = req.body;
    
    if (!jobId && !jobRole) return res.status(400).json({ message: 'Job ID or Job Role is required' });
    
    // Find student and resume, but don't strictly require them to generate a generic prediction
    const student = await Student.findOne({ userId: studentId }).populate('resume');
    let resume = null;
    
    if (student) {
      resume = await Resume.findOne({ studentId: student._id });
    }
    
    // If no resume, create a generic empty structure for the AI
    if (!resume) {
      resume = {
        parsedData: { skills: {}, experience: [], education: [] },
        aiAnalysis: { overallScore: 0 }
      };
    }
    
    let jobTitle = jobRole || "Professional";
    let reqSkills = [jobTitle + " core skills"];
    let reqExp = "Relevant experience";
    let reqEdu = "Relevant degree";

    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      jobTitle = job.title;
      reqSkills = job.requirements?.skills || [];
      reqExp = job.requirements?.experience || 'None';
      reqEdu = job.requirements?.educationLevel || 'None';
    }
    
    const systemPrompt = `You are an AI recruitment analyst with 10+ years of experience predicting candidate success rates.`;
    
    const userPrompt = `
Analyze this candidate's likelihood of success for this job application.

CANDIDATE PROFILE:
Skills: ${JSON.stringify(resume.parsedData?.skills || {})}
Experience: ${JSON.stringify(resume.parsedData?.experience || [])}
Education: ${JSON.stringify(resume.parsedData?.education || [])}
Overall Score: ${resume.aiAnalysis?.overallScore || 0}

JOB REQUIREMENTS:
Title: ${jobTitle}
Required Skills: ${JSON.stringify(reqSkills)}
Experience: ${reqExp}
Education: ${reqEdu}

Return JSON with:
{
  "successProbability": 75,
  "confidenceLevel": "High",
  "matchBreakdown": {
    "skillsMatch": 80,
    "experienceMatch": 70,
    "educationMatch": 85,
    "culturalFit": 65
  },
  "competingCandidates": {
    "estimatedApplicants": 150,
    "yourRanking": "Top 25%",
    "competitiveness": "Medium"
  },
  "strengthsForThisRole": ["strength1", "strength2", "strength3"],
  "gapsForThisRole": ["gap1", "gap2"],
  "improvementSimulation": {
    "ifYouAdd": [
      {"skill": "React", "probabilityIncrease": 15},
      {"skill": "AWS", "probabilityIncrease": 10}
    ],
    "ifYouGain": [
      {"experience": "6 months more", "probabilityIncrease": 20}
    ]
  },
  "applicationTiming": {
    "optimalTime": "Within next 48 hours",
    "reason": "Job posted recently, fewer applicants"
  },
  "recommendedActions": [
    "Add React to skills section",
    "Highlight project X in cover letter",
    "Obtain AWS certification"
  ]
}
`;

    const prediction = await callGroqAPI(userPrompt, systemPrompt);
    
    res.status(200).json({
      success: true,
      data: prediction
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { studentId, jobId, jobRole } = req.body;
    
    if (!jobId && !jobRole) return res.status(400).json({ message: 'Job ID or Job Role is required' });
    
    // Find student and resume, but don't restrict if not found
    const student = await Student.findOne({ userId: studentId });
    let resume = null;

    if (student) {
      resume = await Resume.findOne({ studentId: student._id });
    }
    
    if (!resume) {
      resume = {
        parsedData: { skills: {}, experience: [], education: [] }
      };
    }
    
    let jobTitle = jobRole || "Professional";
    let requirements = { skills: [jobTitle + " technical skills", "communication"] };
    
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      jobTitle = job.title;
      requirements = job.requirements;
    }
    
    const systemPrompt = `You are an expert technical interviewer and HR professional.`;
    
    const userPrompt = `
Generate 10 personalized interview questions for this candidate and job.

CANDIDATE RESUME:
${JSON.stringify(resume?.parsedData || {})}

JOB DETAILS:
Title: ${jobTitle}
Requirements: ${JSON.stringify(requirements)}

Return JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Tell me about your experience with React",
      "type": "technical",
      "difficulty": "medium",
      "category": "Frontend Development",
      "expectedAnswerPoints": ["Point 1", "Point 2"],
      "followUpQuestions": ["Follow up 1"],
      "scoringCriteria": "Look for understanding of hooks, state management"
    }
  ],
  "interviewStructure": {
    "icebreakers": 1,
    "technical": 5,
    "behavioral": 3,
    "situational": 1
  },
  "estimatedDuration": "45-60 minutes",
  "preparationTips": ["Tip 1", "Tip 2"]
}
`;

    const questions = await callGroqAPI(userPrompt, systemPrompt);
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.simulateMockInterview = async (req, res) => {
  try {
    const { questionId, userAnswer, conversationHistory } = req.body;
    const systemPrompt = `You are a professional interviewer. Evaluate answers and provide constructive feedback.`;
    
    const lastQuestion = conversationHistory && conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].question : 'General Interview Question';

    const userPrompt = `
QUESTION: ${lastQuestion}
CANDIDATE'S ANSWER: ${userAnswer}

Evaluate this answer and return JSON:
{
  "score": 7.5,
  "maxScore": 10,
  "evaluation": {
    "strengths": ["Good structure", "Clear examples"],
    "weaknesses": ["Could add more technical depth"],
    "missingPoints": ["Didn't mention scalability"]
  },
  "feedback": "Your answer demonstrates solid understanding...",
  "improvementSuggestions": ["Add more specific examples", "Mention metrics"],
  "followUpQuestion": "Can you explain how you handled X situation?",
  "bestPracticeAnswer": "An ideal answer would include..."
}
`;

    const evaluation = await callGroqAPI(userPrompt, systemPrompt);
    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateSalaryNegotiationStrategy = async (req, res) => {
  try {
    const { jobId, offerDetails } = req.body;
    
    const student = await Student.findOne({ userId: req.user._id });
    const job = await Job.findById(jobId);
    
    const systemPrompt = `You are a professional salary negotiation coach and career advisor.`;
    
    const userPrompt = `
Help this candidate negotiate their job offer.

CANDIDATE PROFILE:
Experience: ${JSON.stringify(student.parsedResume?.experience || [])}
Skills: ${JSON.stringify(student.aiSkills || [])}
Current Score: ${student.profileStrengthScore || 0}

JOB OFFER:
Title: ${job.title}
Company: ${job.companyName || 'The Company'}
Offered Salary: $${offerDetails?.offeredSalary || job.salary?.min || 0}
Benefits: ${JSON.stringify(offerDetails?.benefits || [])}

MARKET DATA:
Average for role: $${job.salary?.min || 0}-$${job.salary?.max || 0}

Return JSON:
{
  "offerAnalysis": {
    "isCompetitive": true,
    "percentile": "65th percentile",
    "comparedToMarket": "5% below average"
  },
  "recommendedCounter": {
    "salaryRange": {"min": 85000, "max": 95000},
    "reasoning": "Based on your skills and market rates",
    "confidenceLevel": "High"
  },
  "negotiationScript": {
    "opening": "Thank you for the offer. I'm excited about...",
    "valueProposition": "Given my experience in X and expertise in Y...",
    "ask": "Would you be able to consider a salary in the range of...",
    "alternatives": ["If salary is fixed, can we discuss..."]
  },
  "negotiationTactics": [
    "Emphasize your React + AWS skills which are in demand",
    "Mention your proven track record with Project X"
  ],
  "thingsToNegotiate": [
    {"item": "Salary", "priority": "High", "strategy": "..."}
  ],
  "commonMistakes": [
    "Don't mention other offers unless real"
  ],
  "timeline": "Respond within 24-48 hours",
  "walkAwayPoint": "If final offer is below..."
}
`;

    const strategy = await callGroqAPI(userPrompt, systemPrompt);
    res.status(200).json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateCareerRoadmap = async (req, res) => {
  try {
    const { careerGoal, timeframe } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    const resume = await Resume.findOne({ studentId: student._id });
    
    const systemPrompt = `You are a senior career counselor with expertise in tech career development.`;
    
    const userPrompt = `
Create a detailed 3-year career development plan.

CURRENT STATE:
Skills: ${JSON.stringify(resume?.parsedData?.skills || {})}
Experience: ${JSON.stringify(resume?.parsedData?.experience || [])}
Career Level: ${resume?.aiAnalysis?.careerInsights?.experienceLevel || 'Fresher'}

GOAL: ${careerGoal || 'Software Engineer'}
TIMEFRAME: ${timeframe || 3} years

Return JSON:
{
  "roadmap": [
    {
      "year": 1,
      "quarter": 1,
      "phase": "Foundation Building",
      "objectives": [
        "Master React fundamentals",
        "Build 3 portfolio projects"
      ],
      "skillsToAcquire": [
        {
          "skill": "React Hooks",
          "priority": "Critical",
          "timeToLearn": "2 months",
          "resources": ["Course X", "Book Y"],
          "projectIdea": "Build a task manager app"
        }
      ],
      "certifications": ["AWS Cloud Practitioner"],
      "networkingGoals": ["Attend 2 meetups"],
      "expectedSalary": {"min": 40000, "max": 60000},
      "jobTitles": ["Junior Frontend Developer"],
      "milestones": [
        "Complete certification"
      ]
    }
  ],
  "skillProgression": {
    "current": ["HTML", "CSS", "JavaScript"],
    "year1": ["React", "Node.js", "MongoDB"],
    "year2": ["Next.js", "TypeScript", "AWS"],
    "year3": ["System Design", "Microservices"]
  },
  "salaryProgression": {
    "current": 0,
    "year1": 50000,
    "year2": 80000,
    "year3": 120000
  },
  "roleProgression": [
    {"year": 1, "role": "Junior Developer"},
    {"year": 2, "role": "Mid-level Developer"},
    {"year": 3, "role": "Senior Developer"}
  ]
}
`;

    const roadmap = await callGroqAPI(userPrompt, systemPrompt);
    
    // Attempt saving to student profile if schema supports it, otherwise just return
    try {
      student.careerGoals = careerGoal;
      await student.save();
    } catch(e) { console.error('Failed saving goals to student', e.message); }

    res.status(200).json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.analyzeResumeGaps = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const resume = await Resume.findOne({ studentId: student._id }).sort({ uploadedAt: -1 });
    if (!resume) return res.status(404).json({ message: 'No resume found' });
    
    const systemPrompt = `You are a professional resume editor and career strategist.`;
    
    const userPrompt = `
Analyze this resume for gaps, inconsistencies, and weak points. Provide detailed fixes.

RESUME DATA:
${JSON.stringify(resume.parsedData)}

Analyze and return JSON:
{
  "employmentGaps": [
    {
      "gapPeriod": "Jan 2022 - Jun 2022",
      "duration": "6 months",
      "severity": "Medium",
      "detectedIssue": "Gap between graduation and first job",
      "suggestedFixes": [
        {
          "strategy": "Highlight freelance work",
          "rewrittenText": "Freelance Web Developer (Jan 2022 - Jun 2022)\\nDeveloped 5 client websites using React and Node.js",
          "explanation": "Converts gap into productive experience"
        }
      ]
    }
  ],
  "inconsistencies": [
    {
      "type": "Date overlap",
      "issue": "Job B starts before Job A ends",
      "locations": ["Experience section, items 2-3"],
      "suggestedFix": "Adjust Job B start date to June 2023",
      "correctedData": {}
    }
  ],
  "weakSections": [
    {
      "section": "Project descriptions",
      "issue": "Too generic, lacks metrics",
      "currentText": "Built a web application using React",
      "improvedVersion": "Developed a task management web app using React and Firebase, serving 500+ daily active users with 95% positive feedback",
      "improvement": "+65% impact",
      "why": "Added specific tech stack, metrics, and user impact"
    }
  ],
  "missingElements": [
    {
      "element": "Quantifiable achievements",
      "importance": "Critical",
      "examples": [
        "Instead of 'Improved performance', say 'Reduced load time by 40%'"
      ]
    }
  ],
  "formattingIssues": [
    {
      "issue": "Inconsistent date formats",
      "locations": ["Experience section"],
      "fix": "Standardize all dates to 'Month YYYY - Month YYYY'"
    }
  ],
  "overallHealthScore": 72,
  "criticalIssues": 2,
  "minorIssues": 5,
  "autoFixAvailable": true,
  "estimatedTimeToFix": "15 minutes"
}
`;

    const analysis = await callGroqAPI(userPrompt, systemPrompt);
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.autoFixResume = async (req, res) => {
  try {
    const { resumeId, fixOptions } = req.body;
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    
    const systemPrompt = `You are an expert resume writer. Apply the requested fixes to this resume.`;
    
    const userPrompt = `
Apply these fixes to the resume:

ORIGINAL RESUME:
${JSON.stringify(resume.parsedData)}

FIXES TO APPLY:
${JSON.stringify(fixOptions)}

Return the complete updated resume with all fixes applied in the same JSON format.
`;

    const fixedResume = await callGroqAPI(userPrompt, systemPrompt);
    
    // Save updated resume
    resume.parsedData = fixedResume;
    resume.aiAnalysis.lastUpdated = new Date();
    await resume.save();
    
    res.status(200).json({
      success: true,
      message: 'Resume automatically fixed!',
      data: fixedResume
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
