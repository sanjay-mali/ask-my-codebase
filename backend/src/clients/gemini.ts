import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export const googleGenAI = new GoogleGenAI({
  apiKey: env.googleApiKey,
});
