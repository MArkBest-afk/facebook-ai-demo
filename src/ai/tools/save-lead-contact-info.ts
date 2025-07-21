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
    const userId = ai.flow.context.get('userId');
    if (!userId) {
        throw new Error("User ID not found in flow context. Cannot save lead details.");
    }
    
    console.log(`Saving lead details for user ${userId}:`, input);
    return await saveLeadDetails(userId, input.firstName, input.lastName, input.phone, input.email);
  }
);
