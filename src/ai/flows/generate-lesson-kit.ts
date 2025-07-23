
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
  worksheet: z.string().describe('A worksheet with exercises related to the lesson topic.'),
  activity: z.string().describe('A fun and engaging activity related to the lesson topic.'),
});
export type GenerateLessonKitOutput = z.infer<
  typeof GenerateLessonKitOutputSchema
>;

export async function generateLessonKit(
  input: GenerateLessonKitInput
): Promise<GenerateLessonKitOutput> {
  return generateLessonKitFlow(input);
}

const lessonKitPrompt = ai.definePrompt({
    name: 'lessonKitPrompt',
    input: { schema: GenerateLessonKitInputSchema },
    output: { schema: z.object({
        lessonPlan: z.string().describe('A detailed, culturally relevant lesson plan.'),
        worksheet: z.string().describe('A worksheet with exercises related to the lesson topic.'),
        activity: z.string().describe('A fun and engaging activity related to the lesson topic.'),
    })},
    prompt: `You are an expert instructional designer and curriculum planner. For the lesson topic "{{lessonTopic}}" and language "{{language}}", generate a comprehensive, innovative, and culturally relevant lesson kit.

Your response must include:
1.  **Lesson Plan:** A detailed lesson plan that includes:
    *   **Learning Objectives:** Clear, measurable goals for student learning.
    *   **Materials:** A list of required materials.
    *   **Procedure:** A step-by-step guide for the lesson, including an introduction, direct instruction, guided practice, and independent practice.
    *   **Differentiation:** Strategies to support diverse learners.
    *   **Assessment:** Methods to check for student understanding.

2.  **Worksheet:** A worksheet with a variety of exercises that reinforce the lesson's concepts.

3.  **Classroom Activity:** A curriculum-mapped, hands-on, and engaging classroom activity that allows students to apply what they've learned. The activity should be creative and collaborative.
`
});


const generateLessonKitFlow = ai.defineFlow(
  {
    name: 'generateLessonKitFlow',
    inputSchema: GenerateLessonKitInputSchema,
    outputSchema: GenerateLessonKitOutputSchema,
  },
  async ({lessonTopic, language}) => {
    // Run all generations in parallel to speed things up.
    const [visualAidResult, otherMaterialsResult] =
      await Promise.all([
        ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A simple, clear, blackboard-friendly diagram or chart for a lesson on: "${lessonTopic}"`,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        }),
        lessonKitPrompt({lessonTopic, language})
      ]);

    const visualAidImageUri = visualAidResult.media?.url;
    if (!visualAidImageUri) {
        throw new Error('Failed to generate visual aid image.');
    }

    const descriptionResult = await ai.generate({
        prompt: `Briefly describe the attached image which is a visual aid for a lesson on "${lessonTopic}".`,
        media: [{ url: visualAidImageUri }],
    });

    const otherMaterials = otherMaterialsResult.output!;

    return {
      lessonPlan: otherMaterials.lessonPlan,
      visualAid: {
        diagramDataUri: visualAidImageUri,
        diagramDescription: descriptionResult.text || `A visual aid for: ${lessonTopic}`
      },
      worksheet: otherMaterials.worksheet,
      activity: otherMaterials.activity
    };
  }
);
