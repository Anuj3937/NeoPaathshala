
'use server';
/**
 * @fileOverview A flow for generating a weekly lesson plan from a textbook image.
 *
 * - generateWeeklyPlan - A function that handles the weekly plan generation process.
 * - GenerateWeeklyPlanInput - The input type for the generateWeeklyPlan function.
 * - GenerateWeeklyPlanOutput - The return type for the generateWeeklyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklyPlanInputSchema = z.object({
  textbookImage: z
    .string()
    .describe(
      "A photo of a textbook page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z
    .string()
    .describe(
      'The target language for the content (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati).'
    ),
});
export type GenerateWeeklyPlanInput = z.infer<typeof GenerateWeeklyPlanInputSchema>;

const GenerateWeeklyPlanOutputSchema = z.object({
  lessons: z.array(z.object({
      day: z.string().describe("The day of the week (e.g., Monday, Tuesday)."),
      topic: z.string().describe("The topic for the day's lesson."),
      activities: z.string().describe("A brief description of the teaching activities for the day."),
  })).describe('A list of 5 lessons for a week.')
});
export type GenerateWeeklyPlanOutput = z.infer<typeof GenerateWeeklyPlanOutputSchema>;

export async function generateWeeklyPlan(
  input: GenerateWeeklyPlanInput
): Promise<GenerateWeeklyPlanOutput> {
  return generateWeeklyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeeklyPlanPrompt',
  input: {schema: GenerateWeeklyPlanInputSchema},
  output: {schema: GenerateWeeklyPlanOutputSchema},
  prompt: `You are an expert instructional designer. Based on the provided textbook page, create a 5-day weekly lesson plan in the specified language. For each day, provide a lesson topic and a brief description of the activities.

  Textbook Page: {{media url=textbookImage}}
  Language: {{{language}}}
  
  Generate a plan for Monday through Friday.`,
});

const generateWeeklyPlanFlow = ai.defineFlow(
  {
    name: 'generateWeeklyPlanFlow',
    inputSchema: GenerateWeeklyPlanInputSchema,
    outputSchema: GenerateWeeklyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
