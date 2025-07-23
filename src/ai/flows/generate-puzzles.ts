
'use server';
/**
 * @fileOverview A flow for generating educational puzzles.
 *
 * - generatePuzzles - A function that handles the puzzle generation process.
 * - GeneratePuzzlesInput - The input type for the generatePuzzles function.
 * - GeneratePuzzlesOutput - The return type for the generatePuzzles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePuzzlesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate a puzzle.'),
  language: z
    .string()
    .describe(
      'The target language for the content (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati).'
    ),
});
export type GeneratePuzzlesInput = z.infer<typeof GeneratePuzzlesInputSchema>;

const GeneratePuzzlesOutputSchema = z.object({
  puzzleType: z.string().describe("The type of puzzle generated (e.g., 'Word Search')."),
  title: z.string().describe('The title of the puzzle.'),
  instructions: z.string().describe('The instructions for how to solve the puzzle.'),
  words: z.array(z.string()).describe('A list of words to find in the puzzle.'),
  grid: z.array(z.array(z.string())).describe('The puzzle grid, represented as an array of arrays of letters.'),
  solution: z.array(z.array(z.string())).describe('The solution grid, showing where the words are located.'),
});
export type GeneratePuzzlesOutput = z.infer<typeof GeneratePuzzlesOutputSchema>;

const generatePuzzlesFlow = ai.defineFlow(
  {
    name: 'generatePuzzlesFlow',
    inputSchema: GeneratePuzzlesInputSchema,
    outputSchema: GeneratePuzzlesOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
        name: 'generatePuzzlesPrompt',
        input: {schema: GeneratePuzzlesInputSchema},
        output: {schema: GeneratePuzzlesOutputSchema},
        prompt: `You are an expert puzzle designer. For the topic "{{topic}}" in language "{{language}}", create an engaging Word Search puzzle.

        - The puzzle should have a title and instructions.
        - The grid should be 15x15 characters.
        - Generate a list of 10-15 relevant words to find.
        - Provide both the puzzle grid and a solution grid. In the solution grid, highlight the found words with their letters and replace other cells with a '.'.
        - Ensure the puzzle is solvable and the words are culturally relevant to the topic and language.
        `
    });

    const {output} = await prompt(input);
    return output!;
  }
);


export async function generatePuzzles(
  input: GeneratePuzzlesInput
): Promise<GeneratePuzzlesOutput> {
  return generatePuzzlesFlow(input);
}
