
'use server';
/**
 * @fileOverview A flow for generating educational flashcards.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate flashcards.'),
  language: z
    .string()
    .describe(
      'The target language for the content (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati).'
    ),
});
export type GenerateFlashcardsInput = z.infer<
  typeof GenerateFlashcardsInputSchema
>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(z.object({
      front: z.string().describe("The content for the front of the flashcard (e.g., a term or question)."),
      back: z.string().describe("The content for the back of the flashcard (e.g., a definition or answer)."),
  })).describe('An array of flashcards related to the topic.')
});
export type GenerateFlashcardsOutput = z.infer<
  typeof GenerateFlashcardsOutputSchema
>;

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'generateFlashcardsPrompt',
      input: {schema: GenerateFlashcardsInputSchema},
      output: {schema: GenerateFlashcardsOutputSchema},
      prompt: `You are an expert in creating educational materials. For the topic "{{topic}}" and language "{{language}}", generate a set of 10-15 clear and concise flashcards. Each flashcard should have a 'front' with a key term or question, and a 'back' with its definition or answer.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);


export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}
