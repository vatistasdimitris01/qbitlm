import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage, Source } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (sourceContent: string): Chat => {
  const systemInstruction = `You are an expert assistant specializing in analyzing and answering questions about provided documents. Your name is qbit LM. You must strictly base your answers *only* on the text provided in the 'CONTEXT' section. Do not use any external knowledge or make assumptions beyond the text. If the user's question cannot be answered using the context, you must respond with: "I'm sorry, but I can't answer that question based on the provided source material." Always be concise and direct. --- CONTEXT: ${sourceContent}`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });

  return chat;
};

export const generateGroundedResponse = async (history: ChatMessage[], newUserInput: string, url: string) => {
    const systemInstruction = `You are an expert web analyst. Your goal is to answer questions based *only* on the content of the provided website URL. Use your search tool to explore the website. Do not use any other external knowledge. If the answer cannot be found on the website, state that clearly. The website to analyze is: ${url}`;

    const contents = [
        ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: newUserInput }] }
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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

export const generateMediaResponse = async (prompt: string, source: { content: string, mimeType?: string }) => {
    if (!source.mimeType) {
        return { text: "Cannot process media: missing MIME type.", citations: [] };
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