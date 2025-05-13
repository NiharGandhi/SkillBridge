// lib/gemini.ts
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY! });

export interface AnalysisResult {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  summary: string;
}

export async function analyzeApplicant(
  jobDescription: string,
  profileData: string,
  resumeText: string
): Promise<AnalysisResult> {
  const prompt = `
Analyze this job applicant for the following opportunity:

JOB DESCRIPTION:
${jobDescription}

APPLICANT PROFILE:
${profileData}

RESUME CONTENT:
${resumeText}

Please provide:
1. A compatibility score from 0-100
2. 3 key strengths
3. 2 potential gaps
4. Overall recommendation (Strong Yes, Yes, Maybe, No)
5. Brief summary (2-3 sentences)

Format your response as JSON with these keys: score, strengths, gaps, recommendation, summary

Respond ONLY with the JSON object, no additional text or markdown.
`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    // Add type checking for the response
    if (!response || typeof response !== 'object' || !('text' in response)) {
      throw new Error('Invalid response from Gemini API');
    }

    let responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }
    // Clean the response text
    let jsonString = responseText.trim();
    
    // Remove markdown code block if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```/g, '').trim();
    }

    // Parse the JSON
    const analysis = JSON.parse(jsonString);

    // Validate the response structure
    if (
      typeof analysis?.score !== 'number' ||
      !Array.isArray(analysis?.strengths) ||
      !Array.isArray(analysis?.gaps) ||
      typeof analysis?.recommendation !== 'string' ||
      typeof analysis?.summary !== 'string'
    ) {
      throw new Error("Invalid analysis structure from AI");
    }

    return analysis as AnalysisResult;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze applicant');
  }
}