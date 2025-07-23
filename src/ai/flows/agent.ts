
'use server';
/**
 * @fileOverview The main agentic flow for the Sahayak AI Teaching Assistant.
 * This agent determines which tool to use based on the user's prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

import {
  conductVoiceBasedReadingAssessment,
} from './conduct-voice-based-reading-assessments';
import {
  createDifferentiatedWorksheets,
} from './create-differentiated-worksheets';
import {
  generateCulturallyRelevantContent,
} from './generate-culturally-relevant-content';
import {
  generateLessonKit,
} from './generate-lesson-kit';
import {
  generateVisualAids,
} from './generate-visual-aids';
import {
  generateWeeklyPlan,
} from './generate-weekly-plan';
import {
  provideInstantLocalizedExplanations,
} from './provide-instant-localized-explanations';

// Define the main agent input schema
const AgentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request or question.'),
  language: z.string().describe('The language for the response.'),
  fileDataUri: z.string().optional().describe('An optional file (image or audio) as a data URI.'),
});
export type AgentInput = z.infer<typeof AgentInputSchema>;


const agentPrompt = ai.definePrompt(
    {
      name: 'sahayakAgentPrompt',
      input: { schema: AgentInputSchema },
      tools: [
        conductVoiceBasedReadingAssessment,
        createDifferentiatedWorksheets,
        generateCulturallyRelevantContent,
        generateLessonKit,
        generateVisualAids,
        generateWeeklyPlan,
        provideInstantLocalizedExplanations,
      ],
      prompt: `You are an expert AI Teaching Assistant named Sahayak. Your goal is to understand the user's request and use the available tools to provide the best possible response.

        Analyze the user's prompt and any attached files to determine the most appropriate tool to use.

        Prompt: {{{prompt}}}
        Language: {{{language}}}
        {{#if fileDataUri}}
        Attached File: {{media url=fileDataUri}}
        {{/if}}

        If the user asks a general question or something you can answer directly, provide a helpful explanation.
        If the prompt requires a specific action like creating a worksheet, lesson plan, or visual aid, use the corresponding tool.
        `,
    }
);


export async function agent(input: AgentInput) {
    const { output } = await agentPrompt(input);
    const toolRequest = output?.toolRequest;

    if (!toolRequest) {
        // If no specific tool is called, return the text content as a default explanation.
        return {
            tool: 'provideInstantLocalizedExplanations',
            result: { explanation: output?.text || "I'm sorry, I couldn't determine the right tool for your request. Could you please rephrase?" }
        };
    }

    const toolName = toolRequest.name;
    const toolInput = toolRequest.input as any;
    let result: any;
    
    // The agent might not have all the info for the tool. We fill it in.
    const augmentedInput = {
        ...toolInput,
        language: input.language,
    }

    if(input.fileDataUri) {
       if('textbookImage' in toolInput || toolName === 'createDifferentiatedWorksheets' || toolName === 'generateWeeklyPlan') {
            augmentedInput.textbookImage = input.fileDataUri;
       }
       if('studentRecording' in toolInput || toolName === 'conductVoiceBasedReadingAssessment') {
            augmentedInput.studentRecording = input.fileDataUri;
       }
    }


    switch (toolName) {
        case 'generateWeeklyPlan':
            result = await generateWeeklyPlan(augmentedInput);
            break;
        case 'generateLessonKit':
            result = await generateLessonKit(augmentedInput);
            break;
        case 'generateCulturallyRelevantContent':
            result = await generateCulturallyRelevantContent(augmentedInput);
            break;
        case 'createDifferentiatedWorksheets':
            result = await createDifferentiatedWorksheets(augmentedInput);
            break;
        case 'provideInstantLocalizedExplanations':
            result = await provideInstantLocalizedExplanations(augmentedInput);
            break;
        case 'generateVisualAids':
            result = await generateVisualAids(augmentedInput);
            break;
        case 'conductVoiceBasedReadingAssessment':
            result = await conductVoiceBasedReadingAssessment(augmentedInput);
            break;
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }

    return { tool: toolName, result };
}
