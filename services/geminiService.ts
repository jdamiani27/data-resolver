/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_MERGE } from "../constants";
import { InputData, MergedProfile } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const mergeDataWithFlash = async (input: InputData): Promise<{ json: MergedProfile | null, logs: string[] }> => {
  try {
    const ai = getClient();
    
    const prompt = `
    INPUT CONTEXT:
    Customer Record (JSON): ${JSON.stringify(input.customerRecord)}
    
    Chat Transcript: "${input.chatTranscript}"
    
    Task: Resolve the final state of the customer data based on the chat.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MERGE,
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return {
      json: JSON.parse(jsonStr),
      logs: [
        `Ingested Customer ID: ${input.customerRecord.customer_id}`,
        `Analyzed Chat Intent...`,
        `Merging fields...`,
        `Resolved Golden Record.`
      ]
    };
  } catch (error) {
    console.error("Flash Error:", error);
    return {
      json: null,
      logs: [`Error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
};