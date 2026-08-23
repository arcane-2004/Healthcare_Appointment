const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini Client safely
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Default to gemini-1.5-flash for speed and reliability, fallback to gemini-pro if needed
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Generate AI Pre-Visit Symptom Summary & Urgency Triage
 * @param {string} symptoms
 * @returns {Promise<{ urgencyLevel: string, chiefComplaint: string, suggestedQuestions: string[] } | null>}
 */
const generatePreVisitSummary = async (symptoms) => {
  if (!symptoms || !symptoms.trim()) {
    return {
      urgencyLevel: 'Low',
      chiefComplaint: 'Routine appointment / No specific symptoms detailed',
      suggestedQuestions: ['What is the primary reason for your visit today?']
    };
  }

  const prompt = `You are assisting a healthcare professional.

Analyze the symptoms provided by the patient.

Do NOT diagnose the patient.
Do NOT prescribe medication.
Do NOT invent information.

Return a JSON object with:

{
  "urgencyLevel": "Low | Medium | High",
  "chiefComplaint": "short summary",
  "suggestedQuestions": [
    "question 1",
    "question 2",
    "question 3"
  ]
}

Urgency should only reflect the information provided by the patient.

If symptoms may require urgent medical attention, mark the urgency as High and clearly indicate that the doctor should assess the patient promptly.

Patient symptoms:
${symptoms}`;

  try {
    const model = getGeminiModel();
    if (!model) {
      console.warn('[AI Service] GEMINI_API_KEY is not configured. Using graceful pre-visit fallback.');
      return {
        urgencyLevel: 'Unknown',
        chiefComplaint: symptoms.length > 80 ? symptoms.slice(0, 77) + '...' : symptoms,
        suggestedQuestions: [
          'Can you describe the onset and severity of these symptoms?',
          'Have you noticed any triggers or associated issues?'
        ]
      };
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON block or parse directly
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini response did not contain a valid JSON payload');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate urgency level
    let urgencyLevel = 'Unknown';
    if (['Low', 'Medium', 'High'].includes(parsed.urgencyLevel)) {
      urgencyLevel = parsed.urgencyLevel;
    } else if (parsed.urgencyLevel && typeof parsed.urgencyLevel === 'string') {
      const lower = parsed.urgencyLevel.toLowerCase();
      if (lower.includes('high')) urgencyLevel = 'High';
      else if (lower.includes('med')) urgencyLevel = 'Medium';
      else if (lower.includes('low')) urgencyLevel = 'Low';
    }

    return {
      urgencyLevel: urgencyLevel,
      chiefComplaint: parsed.chiefComplaint || 'Patient reported symptoms',
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : []
    };
  } catch (error) {
    console.error('[AI Service] Pre-visit summary generation failed:', error.message);
    // Graceful fallback according to requirements
    return {
      urgencyLevel: 'Unknown',
      chiefComplaint: 'Automated AI triage unavailable. Please review raw symptoms below.',
      suggestedQuestions: [
        'How long have you been experiencing these symptoms?',
        'Are there any other medical conditions or medications to note?'
      ]
    };
  }
};

/**
 * Generate AI Post-Visit Patient-Friendly Summary
 * @param {string} notes - Doctor's clinical notes
 * @param {Array} prescription - Array of prescription items
 * @returns {Promise<string>}
 */
const generatePostVisitSummary = async (notes, prescription = []) => {
  const formattedPrescription = prescription && prescription.length > 0
    ? JSON.stringify(prescription, null, 2)
    : 'No medications prescribed during this visit.';

  const clinicalNotes = notes || 'No detailed clinical notes provided.';

  const prompt = `You are helping convert a doctor's clinical notes into a simple patient-friendly visit summary.

Do NOT change the doctor's instructions.
Do NOT invent medication.
Do NOT change dosage or frequency.
Do NOT provide a new diagnosis.

Clearly explain:

1. What the doctor discussed
2. Important instructions
3. Medication schedule exactly as prescribed
4. Follow-up steps

Use simple language that a patient can understand.

Doctor's clinical notes:
${clinicalNotes}

Prescription:
${formattedPrescription}`;

  try {
    const model = getGeminiModel();
    if (!model) {
      console.warn('[AI Service] GEMINI_API_KEY is not configured. Using default post-visit message.');
      return 'Your doctor has completed the visit. Please review the prescription and consultation notes.';
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.error('[AI Service] Post-visit summary generation failed:', error.message);
    return 'Your doctor has completed the visit. Please review the prescription and consultation notes.';
  }
};

module.exports = {
  generatePreVisitSummary,
  generatePostVisitSummary
};
