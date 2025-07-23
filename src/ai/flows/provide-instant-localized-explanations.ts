
'use server';
/**
 * @fileOverview A flow that provides instant, localized explanations with relevant analogies in response to voice queries in local languages.
 *
 * - provideInstantLocalizedExplanations - A function that handles the process of providing instant localized explanations.
 * - ProvideInstantLocalizedExplanationsInput - The input type for the provideInstantLocalizedExplanations function.
 * - ProvideInstantLocalizedExplanationsOutput - The return type for the provideInstantLocalizedExplanations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideInstantLocalizedExplanationsInputSchema = z.object({
  query: z
    .string()
    .describe('The voice query in the local language.'),
  language: z.string().describe('The local language of the query. (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati)'),
});
export type ProvideInstantLocalizedExplanationsInput = z.infer<typeof ProvideInstantLocalizedExplanationsInputSchema>;

const ProvideInstantLocalizedExplanationsOutputSchema = z.object({
  explanation: z.string().describe('The localized explanation with relevant analogies.'),
});
export type ProvideInstantLocalizedExplanationsOutput = z.infer<typeof ProvideInstantLocalizedExplanationsOutputSchema>;

export async function provideInstantLocalizedExplanations(input: ProvideInstantLocalizedExplanationsInput): Promise<ProvideInstantLocalizedExplanationsOutput> {
  return provideInstantLocalizedExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideInstantLocalizedExplanationsPrompt',
  input: {schema: ProvideInstantLocalizedExplanationsInputSchema},
  output: {schema: ProvideInstantLocalizedExplanationsOutputSchema},
  prompt: `You are an AI teaching assistant that can provide instant, localized explanations with relevant analogies in response to voice queries in local languages.

  The user will ask a question in their local language, and you will respond with an explanation in the same language. Incorporate reasoning to determine the most relevant analogy to use.

  Language: {{{language}}}
  Query: {{{query}}}`,
});

const provideInstantLocalizedExplanationsFlow = ai.defineFlow(
  {
    name: 'provideInstantLocalizedExplanationsFlow',
    inputSchema: ProvideInstantLocalizedExplanationsInputSchema,
    outputSchema: ProvideInstantLocalizedExplanationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
