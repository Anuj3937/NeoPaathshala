'use server';
/**
 * @fileOverview A flow that generates culturally relevant stories and examples in a specified language.
 *
 * - generateCulturallyRelevantContent - A function that generates culturally relevant content based on a prompt and language.
 * - GenerateCulturallyRelevantContentInput - The input type for the generateCulturallyRelevantContent function.
 * - GenerateCulturallyRelevantContentOutput - The return type for the generateCulturallyRelevantContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCulturallyRelevantContentInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the content.'),
  language: z.string().describe('The target language for the content (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati).'),
});
export type GenerateCulturallyRelevantContentInput = z.infer<
  typeof GenerateCulturallyRelevantContentInputSchema
>;

const GenerateCulturallyRelevantContentOutputSchema = z.object({
  content: z.string().describe('The generated culturally relevant content.'),
});

export type GenerateCulturallyRelevantContentOutput = z.infer<
  typeof GenerateCulturallyRelevantContentOutputSchema
>;

export async function generateCulturallyRelevantContent(
  input: GenerateCulturallyRelevantContentInput
): Promise<GenerateCulturallyRelevantContentOutput> {
  return generateCulturallyRelevantContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCulturallyRelevantContentPrompt',
  input: {schema: GenerateCulturallyRelevantContentInputSchema},
  output: {schema: GenerateCulturallyRelevantContentOutputSchema},
  prompt: `You are an expert in creating culturally relevant stories and examples for students.\n  Generate a story or example in the following language: {{{language}}},\n  based on the following prompt: {{{prompt}}}.\n  The story should be engaging, relatable, and appropriate for a multi-grade classroom setting.`,
});

const generateCulturallyRelevantContentFlow = ai.defineFlow(
  {
    name: 'generateCulturallyRelevantContentFlow',
    inputSchema: GenerateCulturallyRelevantContentInputSchema,
    outputSchema: GenerateCulturallyRelevantContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
