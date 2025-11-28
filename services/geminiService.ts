
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SolveResponse, FileData, SolverMode, FlashcardData } from '../types';

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const solveMathProblem = async (
  textQuestion: string,
  fileData?: FileData,
  mode: SolverMode = 'standard',
  context?: any
): Promise<SolveResponse> => {
  const ai = getGeminiClient();

  // Model Selection
  // Fast -> gemini-2.5-flash-lite
  // Standard -> gemini-2.5-flash
  // Search -> gemini-2.5-flash (with tools)
  let modelName = "gemini-2.5-flash";
  if (mode === 'fast') {
    modelName = "gemini-2.5-flash-lite";
  }

  const parts: any[] = [];

  // Add text context or question
  let promptText = `
    You are an intelligent, encouraging, and interactive Math Tutor.
    Your goal is NOT just to calculate answers, but to TEACH and ensure understanding based on the user's specific command.

    Analyze the user's intent from their input:
    - If they ask "Solve...", provide a clear, step-by-step solution.
    - If they ask "Explain..." or "Teach me...", focus heavily on the 'concept' and make the 'steps' very descriptive and educational.
    - If they ask "Check...", look at the provided image or text and gently correct any mistakes.

    If an image or document is provided, first perform OCR to extract the mathematical content, then address the user's command regarding it.

    Return the result in JSON format with the following structure:
    - answer: The final result.
    - steps: An array of strings. Write these conversationally, like a teacher speaking to a student (e.g., "First, let's identify...", "Notice that...").
    - concept: A clear, easy-to-understand explanation of the mathematical concept used (e.g., "Chain Rule", "Pythagorean Theorem").
    
    Use LaTeX formatting for all mathematical expressions, enclosed in single dollar signs $...$ for inline and double $$...$$ for block.
    Example: "The integral of $x^2$ is $\\frac{x^3}{3}$".
    
    Do not use Markdown formatting (like **bold** or # Header) in the text steps, use plain text or LaTeX only.
  `;

  if (mode === 'search') {
    promptText += `\n\nIMPORTANT: You have access to Google Search. Use it to find up-to-date real-world data (e.g. population, currency rates, scientific constants) if the question requires it.`;
    promptText += `\n\nOUTPUT INSTRUCTION: Provide the output strictly in valid JSON format. Do not use markdown code blocks. Just the raw JSON string.`;
  }

  // Contextual Memory
  if (context && context.previousQuestion && context.previousAnswer) {
    promptText += `\n\nPREVIOUS CONVERSATION HISTORY (Use this for context if the user asks a follow-up question):
    User asked: "${context.previousQuestion}"
    You answered: "${context.previousAnswer}"
    `;
  }

  if (textQuestion.trim()) {
    promptText += `\n\nUser Command/Question: ${textQuestion}`;
  }

  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.base64,
      },
    });
    promptText += `\n\nReference the attached file (${fileData.mimeType}) for the problem.`;
  }

  parts.push({ text: promptText });

  const config: any = {};

  if (mode === 'search') {
    // Enable Google Search
    config.tools = [{ googleSearch: {} }];
    // NOTE: We cannot use responseMimeType: "application/json" with Search Grounding in some contexts,
    // so we rely on the prompt to get JSON and manual parsing.
  } else {
    // For Standard and Fast modes, use Native JSON Output
    config.responseMimeType = "application/json";
    config.responseSchema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING },
        steps: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        concept: { type: Type.STRING }
      },
      required: ["answer", "steps", "concept"]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: 'user',
        parts: parts
      },
      config: config
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from the model.");
    }

    let result: SolveResponse;

    if (mode === 'search') {
      // Manual JSON parsing for Search Mode
      // Cleanup potential markdown fences if the model ignores the "no markdown" instruction
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        result = JSON.parse(cleanedText);
      } catch (e) {
        console.error("Failed to parse JSON in search mode. Raw text:", responseText);
        // Fallback
        result = {
          answer: "See steps for details.",
          steps: [responseText],
          concept: "Search Result"
        };
      }

      // Extract Grounding Metadata
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        result.sources = groundingChunks
          .map((c: any) => c.web)
          .filter((w: any) => w)
          .map((w: any) => ({
            title: w.title,
            uri: w.uri
          }));
      }
    } else {
      // Standard/Fast JSON parsing
      result = JSON.parse(responseText);
    }

    return result;

  } catch (error) {
    console.error("Error solving math problem:", error);
    throw new Error("Failed to process the request. Please try again.");
  }
};

export const generateExplanationAudio = async (textToSpeak: string): Promise<string> => {
  const ai = getGeminiClient();
  
  // Clean up LaTeX for better speech synthesis
  // Replacing complex latex with simplified text descriptions where possible, 
  // or just removing delimiters so the model handles it naturally.
  const cleanText = textToSpeak
    .replace(/\$\$/g, '')
    .replace(/\$/g, '');

  const prompt = `Read the following math solution clearly and naturally, like a helpful tutor explaining it to a student. Keep it concise but encouraging: "${cleanText}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio explanation.");
  }
};

export const createFlashcard = async (question: string, answer: string, concept: string): Promise<FlashcardData> => {
  const ai = getGeminiClient();
  
  const prompt = `
    Create a study flashcard based on this math problem.
    Question: ${question}
    Answer: ${answer}
    Concept: ${concept}
    
    Return a JSON object with:
    - front: A concise version of the question or concept to test memory.
    - back: The clear answer/explanation.
    - tip: A helpful hint or mnemonic.
  `;

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             front: { type: Type.STRING },
             back: { type: Type.STRING },
             tip: { type: Type.STRING }
          },
          required: ["front", "back", "tip"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}") as FlashcardData;
  } catch (e) {
    console.error("Flashcard generation failed", e);
    // Fallback
    return { front: question, back: answer, tip: concept };
  }
};

export const analyzeVideo = async (prompt: string, videoData: FileData): Promise<string> => {
  const ai = getGeminiClient();
  
  // Switched to gemini-2.5-flash for faster response times while maintaining good multimodal capabilities
  const model = "gemini-2.5-flash";

  const systemPrompt = `
    You are a friendly and clear video analyst.
    Analyze the uploaded video file in detail.
    
    Your goal is to explain the content simply, as if explaining to a beginner or a young student.
    
    formatting Instructions:
    1. Return the result in pure HTML format.
    2. DO NOT use Markdown characters like * (asterisks) or # (hashes).
    3. Use <h3> for main headings.
    4. Use <p> for paragraphs with comfortable spacing.
    5. Use <ul> and <li> for lists.
    6. Use <strong> tags for emphasis instead of bold asterisks.
    7. If there are math formulas, use LaTeX enclosed in $ signs (e.g. $E=mc^2$).
    
    Structure the response as:
    - <h3>Summary</h3>: A simple overview.
    - <h3>Key Details</h3>: Bullet points of what happened.
    - <h3>Explanation</h3>: A clear breakdown of the concepts found.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: videoData.mimeType,
              data: videoData.base64
            }
          },
          { 
            text: systemPrompt + (prompt ? `\n\nSpecific User Question: ${prompt}` : "")
          }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis generated.");
    
    // Remove any markdown code blocks if the model accidentally adds them
    return text.replace(/```html/g, '').replace(/```/g, '');

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw new Error("Failed to analyze video content. Ensure the file is supported and try again.");
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the audio exactly as spoken.",
          },
        ],
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const getLiveClient = () => {
  return getGeminiClient();
};
