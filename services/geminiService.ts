import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Source } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const buildContents = (history: ChatMessage[], newUserInput: string) => {
    return [
        ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: newUserInput }] }
    ];
};

export const generateGeneralResponseStream = async (history: ChatMessage[], newUserInput: string) => {
    const systemInstruction = `You are a helpful and knowledgeable assistant named qbit LM. Answer the user's questions clearly and concisely.`;
    const response = await ai.models.generateContentStream({
        model,
        contents: buildContents(history, newUserInput),
        config: { systemInstruction },
    });
    return response;
};

export const generateTextContextResponseStream = async (history: ChatMessage[], newUserInput: string, source: Source) => {
    const systemInstruction = `You are an expert assistant, qbit LM. Your task is to answer questions about a provided document.
- First, use the information from the document context provided below.
- If the document doesn't contain the answer, use your own knowledge to respond, but clearly state that the information is not from the source document.
- The user is asking about the document titled: "${source.title}".
---
DOCUMENT CONTEXT:
${source.content}
---`;
    const response = await ai.models.generateContentStream({
        model,
        contents: buildContents(history, newUserInput),
        config: { systemInstruction },
    });
    return response;
};


export const generateGroundedResponse = async (history: ChatMessage[], newUserInput: string, url: string) => {
    const systemInstruction = `You are an expert web analyst named qbit LM. Your goal is to answer questions based *only* on the content of the provided website URL. Use your search tool to explore the website. Do not use any other external knowledge. If the answer cannot be found on the website, state that clearly. The website to analyze is: ${url}`;

    const contents = buildContents(history, newUserInput);

    try {
        const response = await ai.models.generateContent({
            model,
            contents: contents,
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const citations = groundingChunks
            .filter(chunk => chunk.web?.uri && chunk.web?.title)
            .map(chunk => ({
                web: {
                    uri: chunk.web!.uri!,
                    title: chunk.web!.title!,
                }
            }));
        
        return { text, citations };
    } catch (error) {
        console.error("Error generating grounded response:", error);
        return { text: "Sorry, I encountered an error while searching the website. Please try again.", citations: [] };
    }
};

const dataUrlToBase64 = (dataUrl: string): string => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
        console.error("Invalid data URL format");
        return "";
    }
    return parts[1];
};

export const generateMediaResponse = async (prompt: string, source: Source) => {
    if (!source.mimeType || !source.content) {
        return { text: "Cannot process media: missing MIME type or content.", citations: [] };
    }
    
    const mediaPart = {
        inlineData: {
            mimeType: source.mimeType,
            data: dataUrlToBase64(source.content),
        },
    };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [mediaPart, textPart] },
        });

        const text = response.text;
        return { text, citations: [] };
    } catch (error) {
        console.error("Error generating multimodal response:", error);
        return { text: "Sorry, I encountered an error while analyzing the media. Please try again.", citations: [] };
    }
};
