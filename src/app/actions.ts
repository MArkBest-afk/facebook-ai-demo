'use server';

import { headers } from 'next/headers';

export async function sendTelegramNotification() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is not configured in the .env file.');
    return;
  }

  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'N/A';
  // Use `x-forwarded-for` to get the user's IP, which is standard for most hosting platforms.
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';

  // Format the message using MarkdownV2.
  // Note: ` ` ` code blocks are used for the user agent and IP to prevent markdown parsing issues.
  const message = `🚀 *New Session Started*

*Device*: \`${userAgent}\`
*IP Address*: \`${ip}\``;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
      // Disable caching for this request
      cache: 'no-store',
    });

    if (!response.ok) {
        const result = await response.json();
        // Log the error for debugging on the server
        console.error('Telegram API Error:', result.description);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}
