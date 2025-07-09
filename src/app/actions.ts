'use server';

import { headers } from 'next/headers';

// Escapes a string for Telegram's MarkdownV2 format.
// This is necessary to prevent characters like '.' in an IP address from breaking the format.
function escapeMarkdownV2(text: string): string {
  // The characters to escape are: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function sendTelegramNotification(utmData?: { id?: string | null }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsEnv = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatIdsEnv || chatIdsEnv.includes('YOUR_CHAT_ID_HERE')) {
    console.error('Telegram bot token or chat ID is not configured. Please check your .env file.');
    return;
  }

  const chatIds = chatIdsEnv.split(',').map(id => id.trim());
  const headersList = headers();
  
  // Gather all available information
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  const userAgent = headersList.get('user-agent') ?? 'N/A';
  const language = headersList.get('accept-language')?.split(',')[0] ?? 'N/A';
  const referer = headersList.get('referer') ?? 'N/A';
  const platform = headersList.get('sec-ch-ua-platform')?.replace(/"/g, '') ?? 'N/A';

  // Construct the message using MarkdownV2 syntax.
  // Dynamic values are escaped to prevent formatting issues.
  const messageLines = [
    'FB1',
  ];

  if (utmData && utmData.id) {
    messageLines.push('👤 *UTM-метка*');
    messageLines.push(`• *ID:* ${escapeMarkdownV2(utmData.id)}`);
    messageLines.push(''); // separator
  }
  
  messageLines.push(
    '🚀 *New Session Started* 🚀',
    '',
    '*Client Details*',
    `• *IP Address:* ${escapeMarkdownV2(ip)}`,
    `• *Platform:* ${escapeMarkdownV2(platform)}`,
    `• *Language:* ${escapeMarkdownV2(language)}`,
    `• *Referer:* ${escapeMarkdownV2(referer)}`,
    '',
    '*User Agent*',
    '```',
    userAgent, // No need to escape inside a code block
    '```'
  );
  
  const message = messageLines.join('\n');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const sendPromises = chatIds.map(chatId => {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
      cache: 'no-store',
    })
    .then(async (response) => {
      if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Telegram API Error for chat ID ${chatId}:`, response.status, response.statusText, errorBody);
      }
    })
  });

  try {
    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Failed to send one or more Telegram notifications:', error);
  }
}
