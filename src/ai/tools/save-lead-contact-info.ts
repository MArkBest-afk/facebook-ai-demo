'use server';

/**
 * @fileOverview A tool for saving lead contact information.
 */

import { ai } from '@/ai/genkit';
import { saveLeadDetails } from '@/lib/actions';
import { z } from 'zod';

export const saveLeadContactInfo = ai.defineTool(
  {
    name: 'saveLeadContactInfo',
    description: 'Saves the contact information for a user who is ready to deposit funds. Use this tool only after collecting the first name, last name, phone number, and email.',
    inputSchema: z.object({
      userId: z.string().describe("The unique ID of the user. This must be extracted from the context."),
      firstName: z.string().describe("The user's first name."),
      lastName: z.string().describe("The user's last name."),
      phone: z.string().describe("The user's phone number."),
      email: z.string().email().describe("The user's email address."),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async (input) => {
    console.log(`Saving lead details for user ${input.userId}:`, input);
    return await saveLeadDetails(input.userId, input.firstName, input.lastName, input.phone, input.email);
  }
);
