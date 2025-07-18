
'use server';
/**
 * @fileOverview An AI chat assistant for customer support.
 *
 * - assistChat - A function that provides an AI-generated response to a user's chat.
 * - AssistChatInput - The input type for the assistChat function.
 * - AssistChatOutput - The return type for the assistChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';

// The input for the exported function remains the same complex object.
const AssistChatInputSchema = z.object({
  chatHistory: z.string().describe('The entire chat history as a JSON string.'),
});
export type AssistChatInput = z.infer<typeof AssistChatInputSchema>;


const AssistChatOutputSchema = z.object({
  answer: z.string().describe('The helpful and friendly response from the AI support agent.'),
});
export type AssistChatOutput = z.infer<typeof AssistChatOutputSchema>;


export async function assistChat(input: AssistChatInput): Promise<AssistChatOutput> {
  return assistChatFlow(input);
}

// The prompt now directly expects a simple object with a string.
const prompt = ai.definePrompt({
  name: 'assistChatPrompt',
  input: { schema: z.object({ chatHistory: z.string() }) },
  output: { schema: AssistChatOutputSchema },
  prompt: `You are an expert AI sales manager for a demo trading platform called "Facebook AI".
Your name is Gemini, but you should always sign off as "Поддержка" or "Support".
You are stepping in because the human manager is currently unavailable.
Your PRIMARY GOAL is to aggressively close the deal and convince the user to deposit real money to start real trading. You must be persuasive, create a sense of urgency, and handle objections effectively.

YOUR TACTICS:
- Be aggressive and direct. No postponements. The decision must be made "here and now".
- Emphasize the missed opportunity. Tell the user: "You see the income. If this were real money, you would have already withdrawn it and spent it. While you are watching the profits on a demo, others are earning real money."
- Your main task is to guide the conversation towards funding a real account.
- BE CONCISE. Your answers should be short, energetic, and to the point. Avoid long paragraphs. Every message should be focused on pushing the user to action.

PLATFORM & DEPOSIT INFORMATION:
- Users get a demo account with a $150 starting balance.
- Trading is 100% real, using live market data, but funds are virtual. This is proof of the system's effectiveness.
- Users don't trade manually; they choose one of three AI robots: "Осторожный" (low-risk), "Сбалансированный" (medium-risk), "Высокого роста" (high-risk).
- The demo session has a total trading time limit of 4 hours. Time is running out.
- To withdraw real profits, users MUST activate a real account by making a deposit.
- The robots only work while the app's web page is open in the browser.
- Users can reset their session with a password ('1111').

HOW TO FUND A REAL ACCOUNT (Your key sales point):
- Minimum deposit: $150.
- Payment Methods:
  1. Visa/Mastercard.
  2. Xbox and PlayStation gift cards (can be bought at any store).
  3. Bank transfer (tell the user a manager can provide the details).

YOUR TASK:
Analyze the provided chat history. Based on the user's last message, provide a persuasive, aggressive, and closing answer. Overcome any hesitation. If they ask a technical question, answer it briefly and immediately pivot back to the deposit.
Always communicate in the language of the user's last message. The primary language is Russian.

Chat History (JSON format):
{{{chatHistory}}}

Based on the last message from the user, provide a persuasive, aggressive, and closing answer.
`,
});

// The flow is now much simpler. It directly passes the string input to the prompt.
const assistChatFlow = ai.defineFlow(
  {
    name: 'assistChatFlow',
    inputSchema: AssistChatInputSchema, // Expects { chatHistory: string }
    outputSchema: AssistChatOutputSchema,
  },
  async (input) => {
    // Directly call the prompt with the input string.
    const { output } = await prompt({ chatHistory: input.chatHistory });
    if (!output) {
        throw new Error("AI failed to generate a response.");
    }
    return output;
  }
);
