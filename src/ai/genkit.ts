import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {nextPlugin} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    nextPlugin(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
