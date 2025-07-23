'use server';
/**
 * @fileOverview A flow that provides instant, localized explanations with relevant analogies in response to voice queries in local languages.
 *
 * - getLocalizedExplanation - A function that handles the process of providing instant localized explanations.
 * - GetLocalizedExplanationInput - The input type for the getLocalizedExplanation function.
 * - GetLocalizedExplanationOutput - The return type for the getLocalizedExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetLocalizedExplanationInputSchema = z.object({
  query: z
    .string()
    .describe('The voice query in the local language.'),
  language: z.string().describe('The local language of the query.'),
});
export type GetLocalizedExplanationInput = z.infer<typeof GetLocalizedExplanationInputSchema>;

const GetLocalizedExplanationOutputSchema = z.object({
  explanation: z.string().describe('The localized explanation with relevant analogies.'),
});
export type GetLocalizedExplanationOutput = z.infer<typeof GetLocalizedExplanationOutputSchema>;

export async function getLocalizedExplanation(input: GetLocalizedExplanationInput): Promise<GetLocalizedExplanationOutput> {
  return getLocalizedExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLocalizedExplanationPrompt',
  input: {schema: GetLocalizedExplanationInputSchema},
  output: {schema: GetLocalizedExplanationOutputSchema},
  prompt: `You are an AI teaching assistant that can provide instant, localized explanations with relevant analogies in response to voice queries in local languages.

  The user will ask a question in their local language, and you will respond with an explanation in the same language. Incorporate reasoning to determine the most relevant analogy to use.

  Language: {{{language}}}
  Query: {{{query}}}`,
});

const getLocalizedExplanationFlow = ai.defineFlow(
  {
    name: 'getLocalizedExplanationFlow',
    inputSchema: GetLocalizedExplanationInputSchema,
    outputSchema: GetLocalizedExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
