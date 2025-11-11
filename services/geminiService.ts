import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { AnalysisResult } from '../types';

// Helper to convert File to a Gemini-compatible part
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

// Helper to parse the raw text response from the model
const parseAnalysisResponse = (responseText: string): AnalysisResult => {
    responseText = responseText.replace(/^```(json\n)?/, '').replace(/```$/, '').trim();

    try {
        const analysisMatch = responseText.match(/\*\*Analysis:\*\*\s*([\s\S]*?)\s*\*\*Verdict:\*\*/);
        const verdictMatch = responseText.match(/\*\*Verdict:\*\*\s*(DUPLICATE|UNIQUE)/);
        const reasoningMatch = responseText.match(/\*\*Reasoning:\*\*\s*([\s\S]*)/);

        if (!analysisMatch || !verdictMatch || !reasoningMatch) {
             console.error("Failed to parse response:", responseText);
             return {
                verdict: 'UNKNOWN',
                analysis: 'Failed to parse the model\'s response. Check the console for details.',
                reasoning: responseText,
            };
        }

        const analysis = analysisMatch[1].trim();
        const verdict = verdictMatch[1] as 'DUPLICATE' | 'UNIQUE';
        const reasoning = reasoningMatch[1].trim();

        return { analysis, verdict, reasoning };

    } catch (error) {
        console.error("Error parsing Gemini response:", error);
        return {
            verdict: 'UNKNOWN',
            analysis: 'An error occurred while parsing the response.',
            reasoning: responseText,
        };
    }
};

export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Make a lightweight, non-streaming call to check validity
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: "test" }] }],
    });
    return true;
  } catch (error) {
    console.error("API Key verification failed:", error);
    return false;
  }
};

export const analyzeImages = async (
  referenceImage: File,
  imageToCheck: File,
  concept: string,
  model: string,
  apiKey: string
): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const referenceImagePart = await fileToGenerativePart(referenceImage);
    const imageToCheckPart = await fileToGenerativePart(imageToCheck);

    const contents = [
        {
            parts: [
                { text: SYSTEM_PROMPT },
                { text: `\n---\n\n## Analysis Request\n\n**Concept:** ${concept}\n\n**Reference Image:**` },
                referenceImagePart,
                { text: `\n\n**Image to Check:**` },
                imageToCheckPart
            ]
        }
    ];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
    });
    
    const responseText = response.text;
    
    if (!responseText) {
        return {
            verdict: 'UNKNOWN',
            analysis: 'The model returned an empty response.',
            reasoning: 'No text was generated. This could be due to safety settings or an API issue.',
        };
    }
    
    return parseAnalysisResponse(responseText);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    let reasoning = `Please check the console for more details.`;
    let analysis = 'An error occurred while communicating with the Gemini API.';

    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            analysis = 'Invalid API Key';
            reasoning = 'The API key provided is invalid. Please ensure it is set correctly.';
        } else {
            reasoning += ` Error: ${error.message}`;
        }
    } else {
        reasoning += ` Error: ${String(error)}`;
    }
    
    return {
      verdict: 'UNKNOWN',
      analysis,
      reasoning,
    };
  }
};