'use server';
/**
 * @fileOverview A flow for generating a complete lesson kit.
 *
 * - generateLessonKit - A function that handles the lesson kit generation process.
 * - GenerateLessonKitInput - The input type for the generateLessonKit function.
 * - GenerateLessonKitOutput - The return type for the generateLessonKit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {generateCulturallyRelevantContent} from './generate-culturally-relevant-content';
import {generateVisualAids} from './generate-visual-aids';

const GenerateLessonKitInputSchema = z.object({
  lessonTopic: z
    .string()
    .describe('The topic for which to generate the lesson kit.'),
  language: z
    .string()
    .describe(
      'The target language for the content (e.g., Hindi, Marathi, Tamil, Bengali, Gujarati).'
    ),
});
export type GenerateLessonKitInput = z.infer<
  typeof GenerateLessonKitInputSchema
>;

const GenerateLessonKitOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan.'),
  visualAid: z.object({
    diagramDescription: z
      .string()
      .describe('A textual description of the generated diagram or chart.'),
    diagramDataUri: z
      .string()
      .describe(
        "The diagram or chart as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
      ),
  }),
});
export type GenerateLessonKitOutput = z.infer<
  typeof GenerateLessonKitOutputSchema
>;

export async function generateLessonKit(
  input: GenerateLessonKitInput
): Promise<GenerateLessonKitOutput> {
  return generateLessonKitFlow(input);
}

const generateLessonKitFlow = ai.defineFlow(
  {
    name: 'generateLessonKitFlow',
    inputSchema: GenerateLessonKitInputSchema,
    outputSchema: GenerateLessonKitOutputSchema,
  },
  async ({lessonTopic, language}) => {
    // Run all generations in parallel to speed things up.
    const [lessonPlanResult, visualAidResult] =
      await Promise.all([
        generateCulturallyRelevantContent({prompt: lessonTopic, language}),
        generateVisualAids({lessonTopic}),
      ]);

    return {
      lessonPlan: lessonPlanResult.content,
      visualAid: visualAidResult,
    };
  }
);
