import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Gemini features are disabled.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}

const safeGenerateContent = async (prompt: string, schema?: any): Promise<GenerateContentResponse> => {
  try {
    const genAI = getAi();
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: schema ? "application/json" : "text/plain",
        responseSchema: schema,
      },
    });
    return result;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
        throw new Error("The Gemini API key is not configured correctly.");
    }
    throw new Error("Failed to get a response from Gemini.");
  }
};

export const generateChapterSummary = async (chapterText: string): Promise<string> => {
  const prompt = `Please provide a concise summary of the following chapter text:\n\n---\n\n${chapterText}`;
  const response = await safeGenerateContent(prompt);
  return response.text;
};

export const extractEntities = async (chapterText: string): Promise<{ characters: any[], places: any[] }> => {
  const prompt = `Analyze the following chapter text and identify the key characters and places mentioned. For each character and place, provide a brief, one-sentence description based on the text provided. If no characters or places are mentioned, return empty arrays.
  
  Chapter Text:
  ---
  ${chapterText}
  ---
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
        },
      },
      places: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
        },
      },
    },
  };

  const response = await safeGenerateContent(prompt, schema);
  const jsonText = response.text.trim();
  if (!jsonText) {
    return { characters: [], places: [] };
  }
  return JSON.parse(jsonText);
};


export const semanticSearchInNovel = async (query: string, novelText: string): Promise<any[]> => {
  const prompt = `I am searching a novel for content related to: "${query}". 
  
  Please analyze the following novel text and find the most relevant quotes or passages that match my query. For each finding, provide the direct quote and a brief description of its context.
  
  Novel Text (excerpt):
  ---
  ${novelText.substring(0, 20000)}
  ---
  `;
  
  const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: {
            type: Type.STRING,
            description: "The direct quote from the text relevant to the query.",
          },
          context: {
            type: Type.STRING,
            description: "A brief explanation of the context surrounding the quote.",
          },
        },
      },
  };

  const response = await safeGenerateContent(prompt, schema);
  const jsonText = response.text.trim();
  if (!jsonText) {
    return [];
  }
  return JSON.parse(jsonText);
};
