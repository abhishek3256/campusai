const groq = require('../config/groq');

// Note: In a real scenario, we would use an OCR service (like Tesseract or Cloudinary OCR) to extract text from the image first.
// Since we are using Groq text-only model (llama-3.3-70b), we assume 'ocrText' is passed to this function.
// For the purpose of this project, we'll assume the frontend or another service sends the extracted text, 
// or if we had a vision model we'd send the image. 
// Given the dependencies (pdf-parse, mammoth), we can extract text from docs/PDFs. 
// For images, we will Simulate OCR or assume text is extracted.
// *Wait*, Llama 3.3 is text-only. The prompt implies "From this marksheet text: [OCR text]".
// I will implement the logic expecting text input.

const verifyDocument = async (ocrText, documentType) => {
    try {
        const prompt = `
        Document Type: ${documentType}
        Extracted Text:
        ${ocrText}
        
        Task:
        Extract the following fields if present:
        - Student Name
        - Institution Name
        - Year of Passing
        - Marks Obtained
        - Total Marks
        - Percentage/CGPA
        
        Also, perform a basic legitimacy check based on the text format and consistency.
        
        Return ONLY valid JSON:
        {
            "extractedData": {
                "studentName": string,
                "institution": string,
                "year": number,
                "marks": number,
                "percentage": number
            },
            "verificationStatus": "verified" | "rejected" | "pending",
            "confidenceScore": number (0-100),
            "reason": string
        }`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a strict document verification AI. Analyze the text for authenticity.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
        console.error('Document Verification Error:', error);
        throw new Error('Verification failed');
    }
};

module.exports = { verifyDocument };
