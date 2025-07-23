'use server';
/**
 * @fileOverview Visual aid generation flow for teachers.
 * 
 * - generateVisualAids - A function that handles the generation of visual aids from a lesson topic.
 * - GenerateVisualAidsInput - The input type for the generateVisualAids function.
 * - GenerateVisualAidsOutput - The return type for the generateVisualAids function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVisualAidsInputSchema = z.object({
  lessonTopic: z.string().describe('The topic of the lesson for which to generate visual aids.'),
});
export type GenerateVisualAidsInput = z.infer<typeof GenerateVisualAidsInputSchema>;

const GenerateVisualAidsOutputSchema = z.object({
  diagramDescription: z.string().describe('A textual description of the generated diagram or chart.'),
  diagramDataUri: z
    .string()
    .describe(
      'The diagram or chart as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type GenerateVisualAidsOutput = z.infer<typeof GenerateVisualAidsOutputSchema>;

export async function generateVisualAids(input: GenerateVisualAidsInput): Promise<GenerateVisualAidsOutput> {
  return generateVisualAidsFlow(input);
}

const generateVisualAidsFlow = ai.defineFlow(
  {
    name: 'generateVisualAidsFlow',
    inputSchema: GenerateVisualAidsInputSchema,
    outputSchema: GenerateVisualAidsOutputSchema,
  },
  async ({ lessonTopic }) => {
    // Generate the image first
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A simple, clear, blackboard-friendly diagram or chart for a lesson on: "${lessonTopic}"`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], 
      },
    });

    const diagramDataUri = media?.url;
    if (!diagramDataUri) {
      throw new Error('Failed to generate image for visual aid.');
    }

    // Generate a description for the image
    const { text } = await ai.generate({
      prompt: `Briefly describe the attached image which is a visual aid for a lesson on "${lessonTopic}".`,
      media: [
        { url: diagramDataUri },
      ],
    });

    const diagramDescription = text || `A visual aid for the lesson: ${lessonTopic}`;

    return {
      diagramDescription,
      diagramDataUri,
    };
  }
);
