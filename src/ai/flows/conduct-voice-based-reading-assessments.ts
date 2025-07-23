'use server';
/**
 * @fileOverview A flow for conducting voice-based reading assessments and providing automated feedback.
 *
 * - conductVoiceBasedReadingAssessment - A function that handles the voice-based reading assessment process.
 * - ConductVoiceBasedReadingAssessmentInput - The input type for the conductVoiceBasedReadingAssessment function.
 * - ConductVoiceBasedReadingAssessmentOutput - The return type for the conductVoiceBasedReadingAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConductVoiceBasedReadingAssessmentInputSchema = z.object({
  studentName: z.string().describe('The name of the student being assessed.'),
  readingText: z.string().describe('The text the student will read.'),
  studentRecording: z
    .string()
    .describe(
      'The student\'s voice recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type ConductVoiceBasedReadingAssessmentInput = z.infer<
  typeof ConductVoiceBasedReadingAssessmentInputSchema
>;

const ConductVoiceBasedReadingAssessmentOutputSchema = z.object({
  accuracyScore: z
    .number()
    .describe('The accuracy score of the student\'s reading (0-100).'),
  fluencyFeedback: z
    .string()
    .describe('Feedback on the student\'s reading fluency.'),
  comprehensionQuestions: z.array(z.string()).describe('Comprehension questions related to the reading text.'),
});
export type ConductVoiceBasedReadingAssessmentOutput = z.infer<
  typeof ConductVoiceBasedReadingAssessmentOutputSchema
>;

export async function conductVoiceBasedReadingAssessment(
  input: ConductVoiceBasedReadingAssessmentInput
): Promise<ConductVoiceBasedReadingAssessmentOutput> {
  return conductVoiceBasedReadingAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conductVoiceBasedReadingAssessmentPrompt',
  input: {schema: ConductVoiceBasedReadingAssessmentInputSchema},
  output: {schema: ConductVoiceBasedReadingAssessmentOutputSchema},
  prompt: `You are an AI assistant designed to assess student reading performance.

  Student Name: {{{studentName}}}
  Reading Text: {{{readingText}}}
  Student Recording: {{media url=studentRecording}}

  Analyze the student's recording of their reading of the provided text.  Provide feedback and grade the student based on their reading accuracy and fluency.

  Output should include an accuracy score (0-100), feedback on their fluency, and a few comprehension questions.

  Grading rubric:
  - 90-100: Excellent
  - 80-89: Good
  - 70-79: Fair
  - Below 70: Needs Improvement
  `,
});

const conductVoiceBasedReadingAssessmentFlow = ai.defineFlow(
  {
    name: 'conductVoiceBasedReadingAssessmentFlow',
    inputSchema: ConductVoiceBasedReadingAssessmentInputSchema,
    outputSchema: ConductVoiceBasedReadingAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
