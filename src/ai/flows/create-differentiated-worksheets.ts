
'use server';
/**
 * @fileOverview Implements the createDifferentiatedWorksheets flow.
 *
 * - createDifferentiatedWorksheets - A function that handles the creation of differentiated worksheets from a textbook image.
 * - CreateDifferentiatedWorksheetsInput - The input type for the createDifferentiatedWorksheets function.
 * - CreateDifferentiatedWorksheetsOutput - The return type for the createDifferentiatedWorksheets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateDifferentiatedWorksheetsInputSchema = z.object({
  textbookImage: z
    .string()
    .describe(
      "A photo of a textbook page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  gradeLevels: z.array(z.string()).describe('The grade levels to tailor the worksheets to.'),
  language: z.string().describe('The target language for the content.'),
});
export type CreateDifferentiatedWorksheetsInput = z.infer<
  typeof CreateDifferentiatedWorksheetsInputSchema
>;

const CreateDifferentiatedWorksheetsOutputSchema = z.object({
  worksheets: z.array(
    z.object({
      gradeLevel: z.string().describe('The grade level of the worksheet.'),
      worksheetContent: z.string().describe('The content of the worksheet.'),
    })
  ),
});
export type CreateDifferentiatedWorksheetsOutput = z.infer<
  typeof CreateDifferentiatedWorksheetsOutputSchema
>;

export async function createDifferentiatedWorksheets(
  input: CreateDifferentiatedWorksheetsInput
): Promise<CreateDifferentiatedWorksheetsOutput> {
  return createDifferentiatedWorksheetsFlow(input);
}

const createDifferentiatedWorksheetsPrompt = ai.definePrompt({
  name: 'createDifferentiatedWorksheetsPrompt',
  input: {schema: CreateDifferentiatedWorksheetsInputSchema},
  output: {schema: CreateDifferentiatedWorksheetsOutputSchema},
  prompt: `You are an expert teacher specializing in creating differentiated worksheets for various grade levels from a textbook page.

You will use the textbook page to generate worksheets tailored to the specified grade levels in the specified language.

Textbook Page: {{media url=textbookImage}}
Grade Levels: {{gradeLevels}}
Language: {{{language}}}

Create differentiated worksheets for each grade level, ensuring the content is appropriate and challenging for that level, and in the correct language.
`,
});

const createDifferentiatedWorksheetsFlow = ai.defineFlow(
  {
    name: 'createDifferentiatedWorksheetsFlow',
    inputSchema: CreateDifferentiatedWorksheetsInputSchema,
    outputSchema: CreateDifferentiatedWorksheetsOutputSchema,
  },
  async input => {
    const {output} = await createDifferentiatedWorksheetsPrompt(input);
    return output!;
  }
);
