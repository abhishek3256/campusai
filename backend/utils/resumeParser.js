const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const groq = require('../config/groq');

/**
 * Call Groq API helper
 */
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
  return completion.choices[0].message.content;
};

/**
 * Download file with retry logic
 */
const downloadFile = async (url, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Downloading file (attempt ${attempt}/${maxRetries})...`);
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      console.log(`✅ File downloaded successfully (${response.data.byteLength} bytes)`);
      return Buffer.from(response.data);
      
    } catch (error) {
      console.error(`Download attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to download file after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * Extract text from PDF or DOCX with fallback methods
 */
const extractTextFromFile = async (fileUrl, mimeType) => {
  try {
    console.log('Starting text extraction from:', fileUrl);
    console.log('MIME type:', mimeType);
    
    // Check if it's a local file or remote
    let buffer;
    if (fileUrl.startsWith('http')) {
      buffer = await downloadFile(fileUrl);
    } else {
      const fs = require('fs');
      buffer = fs.readFileSync(fileUrl);
    }
    
    // PDF extraction
    if (mimeType === 'application/pdf' || fileUrl.endsWith('.pdf')) {
      try {
        const render_page = async (pageData) => {
          const textContent = await pageData.getTextContent();
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
              text += item.str;
            } else {
              text += '\n' + item.str;
            }    
            lastY = item.transform[5];
          }
          
          try {
            const annotations = await pageData.getAnnotations();
            const links = annotations
              .filter(a => a.subtype === 'Link' && a.url)
              .map(a => a.url);
              
            if (links.length > 0) {
              text += '\n\n--- EXTRACTED HYPERLINKS ---\n' + links.join('\n') + '\n----------------------------\n';
            }
          } catch (annotErr) {
            console.error('Failed to extract PDF annotations:', annotErr.message);
          }
          
          return text;
        };

        const data = await pdfParse(buffer, {
          max: 50, // Max 50 pages
          pagerender: render_page
        });
        
        if (!data.text || data.text.trim().length < 50) {
          throw new Error('PDF appears to be empty or contains only images');
        }
        
        console.log(`✅ Extracted ${data.text.length} characters from PDF`);
        return data.text;
        
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError.message);
        throw new Error('Unable to extract text from PDF. Please ensure it contains selectable text.');
      }
    }
    
    // DOCX extraction
    if (mimeType.includes('wordprocessingml') || fileUrl.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        
        if (!result.value || result.value.trim().length < 50) {
          throw new Error('DOCX appears to be empty');
        }
        
        console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
        return result.value;
        
      } catch (docxError) {
        console.error('DOCX parsing failed:', docxError.message);
        throw new Error('Unable to extract text from DOCX file');
      }
    }
    
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

/**
 * Safely parse AI JSON response
 */
const parseAIResponse = (response) => {
  try {
    if (typeof response === 'object' && response !== null) {
      return response;
    }
    
    if (typeof response === 'string') {
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/^```json\s*/i, '');
      cleanResponse = cleanResponse.replace(/^```\s*/i, '');
      cleanResponse = cleanResponse.replace(/\s*```$/i, '');
      
      const parsed = JSON.parse(cleanResponse);
      return parsed;
    }
    
    throw new Error('Invalid response format');
    
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Response was:', response);
    throw new Error('Failed to parse AI response as JSON');
  }
};

/**
 * Validate and sanitize parsed data
 */
const validateParsedData = (data) => {
  const ensureArray = (value) => Array.isArray(value) ? value : [];
  const ensureObject = (value) => (typeof value === 'object' && value !== null) ? value : {};
  
  return {
    personalInfo: ensureObject(data.personalInfo),
    summary: data.summary || '',
    skills: {
      technical: ensureArray(data.skills?.technical),
      softSkills: ensureArray(data.skills?.softSkills),
      tools: ensureArray(data.skills?.tools),
      languages: ensureArray(data.skills?.languages)
    },
    experience: ensureArray(data.experience),
    education: ensureArray(data.education),
    projects: ensureArray(data.projects),
    certifications: ensureArray(data.certifications),
    achievements: ensureArray(data.achievements),
    languages: ensureArray(data.languages)
  };
};

/**
 * Validate and sanitize AI analysis
 */
const validateAIAnalysis = (analysis) => {
  const ensureArray = (value) => Array.isArray(value) ? value : [];
  const ensureNumber = (value, defaultVal = 0) => typeof value === 'number' ? value : defaultVal;
  
  // Fix redFlags if it's a string
  let redFlags = analysis.redFlags || [];
  if (typeof redFlags === 'string') {
    try {
      redFlags = JSON.parse(redFlags);
    } catch (e) {
      redFlags = [];
    }
  }
  if (!Array.isArray(redFlags)) {
    redFlags = [];
  }
  
  return {
    overallScore: ensureNumber(analysis.overallScore, 50),
    detailedScores: {
      skillsQuality: ensureNumber(analysis.detailedScores?.skillsQuality, 50),
      experienceRelevance: ensureNumber(analysis.detailedScores?.experienceRelevance, 50),
      educationStrength: ensureNumber(analysis.detailedScores?.educationStrength, 50),
      projectsImpact: ensureNumber(analysis.detailedScores?.projectsImpact, 50),
      formattingClarity: ensureNumber(analysis.detailedScores?.formattingClarity, 50),
      keywordOptimization: ensureNumber(analysis.detailedScores?.keywordOptimization, 50)
    },
    strengths: ensureArray(analysis.strengths),
    weaknesses: ensureArray(analysis.weaknesses),
    recommendations: {
      skillsToAdd: ensureArray(analysis.recommendations?.skillsToAdd),
      sectionsToImprove: ensureArray(analysis.recommendations?.sectionsToImprove),
      formattingTips: ensureArray(analysis.recommendations?.formattingTips),
      contentSuggestions: ensureArray(analysis.recommendations?.contentSuggestions)
    },
    careerInsights: {
      suitableRoles: ensureArray(analysis.careerInsights?.suitableRoles),
      industryFit: ensureArray(analysis.careerInsights?.industryFit),
      experienceLevel: analysis.careerInsights?.experienceLevel || 'Not Available',
      estimatedYearsOfExperience: ensureNumber(analysis.careerInsights?.estimatedYearsOfExperience, 0)
    },
    atsScore: {
      score: ensureNumber(analysis.atsScore?.score, 50),
      issues: ensureArray(analysis.atsScore?.issues),
      suggestions: ensureArray(analysis.atsScore?.suggestions)
    },
    skillsBreakdown: ensureArray(analysis.skillsBreakdown).map(skill => ({
      skill: skill.skill || '',
      category: skill.category || 'General',
      proficiencyLevel: skill.proficiencyLevel || 'Intermediate',
      evidenceFound: Boolean(skill.evidenceFound),
      contextMentions: ensureNumber(skill.contextMentions, 0)
    })),
    redFlags: redFlags.map(flag => ({
      type: flag.type || 'other',
      severity: flag.severity || 'low',
      description: flag.description || '',
      location: flag.location || 'Unknown'
    })),
    keyHighlights: ensureArray(analysis.keyHighlights),
    industryKeywords: {
      present: ensureArray(analysis.industryKeywords?.present),
      missing: ensureArray(analysis.industryKeywords?.missing)
    }
  };
};

/**
 * Parse resume using Groq AI with retry logic
 */
const parseResumeWithAI = async (resumeText, maxRetries = 2) => {
  const systemPrompt = `You are an expert resume parser. Extract structured data and return ONLY valid JSON.`;
  
  const userPrompt = `Extract all information from this resume. Return ONLY valid JSON with this structure:
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "location": "string", "linkedin": "string", "github": "string", "portfolio": "string"},
  "summary": "string",
  "skills": {"technical": [], "softSkills": [], "tools": [], "languages": []},
  "experience": [{"title": "string", "company": "string", "location": "string", "startDate": "string", "endDate": "string", "current": false, "description": "string", "achievements": []}],
  "education": [{"degree": "string", "institution": "string", "location": "string", "startYear": "string", "endYear": "string", "cgpa": 0, "percentage": 0, "stream": "string"}],
  "projects": [{"name": "string", "description": "string", "technologies": [], "link": "string", "duration": "string"}],
  "certifications": [{"name": "string", "issuer": "string", "date": "string", "credential": "string"}],
  "achievements": [],
  "languages": []
}

RESUME TEXT:
${resumeText.substring(0, 8000)}

Return ONLY the JSON object, no explanations.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Parsing resume with AI (attempt ${attempt}/${maxRetries})...`);
      console.log(`[HOT-DEBUG] SDK Key Starts With: ${groq.apiKey ? groq.apiKey.substring(0, 4) : 'UNDEFINED'} | Length: ${groq.apiKey ? groq.apiKey.length : 0}`);
      
      const response = await callGroqAPI(userPrompt, systemPrompt);
      const parsedData = parseAIResponse(response);
      const validatedData = validateParsedData(parsedData);
      
      console.log('✅ Resume parsed successfully');
      return validatedData;
      
    } catch (error) {
      console.error(`Parse attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`AI parsing failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

/**
 * Generate AI analysis with retry logic
 */
const generateResumeAnalysis = async (resumeText, parsedData, maxRetries = 2) => {
  const systemPrompt = `You are an expert career analyst. Return ONLY valid JSON.`;
  
  const userPrompt = `Analyze this resume comprehensively. Return ONLY valid JSON.

RESUME TEXT:
${resumeText.substring(0, 5000)}

Return this exact structure with actual analysis:
{
  "overallScore": 75,
  "detailedScores": {"skillsQuality": 70, "experienceRelevance": 65, "educationStrength": 80, "projectsImpact": 60, "formattingClarity": 75, "keywordOptimization": 70},
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": {"skillsToAdd": [], "sectionsToImprove": [], "formattingTips": [], "contentSuggestions": []},
  "careerInsights": {"suitableRoles": [], "industryFit": [], "experienceLevel": "Fresher", "estimatedYearsOfExperience": 0},
  "atsScore": {"score": 70, "issues": [], "suggestions": []},
  "skillsBreakdown": [{"skill": "JavaScript", "category": "Technical", "proficiencyLevel": "Intermediate", "evidenceFound": true, "contextMentions": 3}],
  "redFlags": [{"type": "gap", "severity": "low", "description": "Description", "location": "Location"}],
  "keyHighlights": [],
  "industryKeywords": {"present": [], "missing": []}
}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating AI analysis (attempt ${attempt}/${maxRetries})...`);
      
      const response = await callGroqAPI(userPrompt, systemPrompt);
      const analysis = parseAIResponse(response);
      const validatedAnalysis = validateAIAnalysis(analysis);
      
      console.log('✅ AI analysis generated successfully');
      return validatedAnalysis;
      
    } catch (error) {
      console.error(`Analysis attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`AI analysis failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

/**
 * Main resume parsing function with comprehensive error handling
 */
const parseResumeComplete = async (fileUrl, mimeType) => {
  try {
    console.log('=== STARTING RESUME PARSING ===');
    console.log('File URL:', fileUrl);
    console.log('MIME Type:', mimeType);
    
    // Step 1: Extract text
    const resumeText = await extractTextFromFile(fileUrl, mimeType);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Extracted text is too short. Resume may be empty or image-based.');
    }
    
    // Step 2: Parse resume data
    const parsedData = await parseResumeWithAI(resumeText);
    
    // Step 3: Generate AI analysis
    const aiAnalysis = await generateResumeAnalysis(resumeText, parsedData);
    
    console.log('=== RESUME PARSING COMPLETE ===');
    
    return {
      parsedData,
      aiAnalysis,
      extractedText: resumeText.substring(0, 500) // Store first 500 chars for debugging
    };
    
  } catch (error) {
    console.error('=== RESUME PARSING FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
};

const parseResume = async (fileUrl, mimeType) => {
    return parseResumeComplete(fileUrl, mimeType);
};

module.exports = { 
  parseResume, 
  parseResumeComplete,
  extractTextFromFile,
  parseResumeWithAI,
  generateResumeAnalysis
};
