
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

const ChatMessageSchema = z.object({
    id: z.string(),
    sender: z.enum(['user', 'admin']),
    senderName: z.string().optional(),
    text: z.string(),
    timestamp: z.date(),
    read: z.boolean(),
});

const AssistChatInputSchema = z.object({
  chatHistory: z.array(ChatMessageSchema).describe('The entire chat history between the user and the support team.'),
});
export type AssistChatInput = z.infer<typeof AssistChatInputSchema>;

const AssistChatOutputSchema = z.object({
  answer: z.string().describe('The helpful and friendly response from the AI support agent.'),
});
export type AssistChatOutput = z.infer<typeof AssistChatOutputSchema>;


export async function assistChat(input: AssistChatInput): Promise<AssistChatOutput> {
  return assistChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistChatPrompt',
  input: { schema: AssistChatInputSchema },
  output: { schema: AssistChatOutputSchema },
  prompt: `You are an expert AI assistant acting as a support manager for a demo trading platform called "Facebook AI".
Your name is Gemini, but you should always sign off as "Поддержка" or "Support".
You are stepping in because the human manager is currently unavailable. Your tone should be professional, helpful, and reassuring.

PLATFORM INFORMATION:
- Users get a demo account with a $150 starting balance.
- Trading is 100% real, using live market data, but funds are virtual.
- Users don't trade manually; they choose one of three AI robots.
- The robots are: "Осторожный" (low-risk), "Сбалансированный" (medium-risk), "Высокого роста" (high-risk).
- The demo session has a total trading time limit of 4 hours.
- To withdraw funds, users must contact their manager to activate a real account. This is a key point.
- The robots only work while the app's web page is open in the browser.
- Users can reset their session with a password ('1111').

YOUR TASK:
Analyze the provided chat history and the user's latest message. Provide a concise, helpful response to the user's query.
Address the user's questions directly based on the platform information above.
Do not make up features. If you don't know the answer, politely state that you will check with a specialist and get back to them.
Always communicate in the language of the user's last message. The primary language is Russian.

Chat History (JSON format):
{{{json chatHistory}}}

Based on the last message from the user, provide a helpful answer.
`,
});

const assistChatFlow = ai.defineFlow(
  {
    name: 'assistChatFlow',
    inputSchema: AssistChatInputSchema,
    outputSchema: AssistChatOutputSchema,
  },
  async (input) => {
    // Convert Date objects to string representations for the prompt
    const serializableChatHistory = input.chatHistory.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
    }));
    
    const { output } = await prompt({ chatHistory: serializableChatHistory as any });
    return output!;
  }
);
