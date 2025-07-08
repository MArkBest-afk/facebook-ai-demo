'use server';

import { headers } from 'next/headers';

// Helper to escape characters for Telegram's MarkdownV2 parser
function escapeMarkdownV2(text: string): string {
  // List of characters to escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}


export async function sendTelegramNotification() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    console.error('Telegram bot token or chat ID is not configured in the .env file.');
    return;
  }

  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'N/A';
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  
  const country = headersList.get('x-vercel-ip-country') || 'N/A';
  const city = headersList.get('x-vercel-ip-city') || 'N/A';
  const region = headersList.get('x-vercel-ip-country-region') || 'N/A';
  const languages = headersList.get('accept-language')?.split(',')[0] || 'N/A';

  const location = [city, region, country].filter(part => part && part !== 'N/A').join(', ');

  const message = `🚀 *Новая сессия*

*Устройство*: ${escapeMarkdownV2(userAgent)}
*IP-адрес*: ${escapeMarkdownV2(ip)}
*Местоположение*: ${escapeMarkdownV2(location || 'N/A')}
*Языки*: ${escapeMarkdownV2(languages)}`;

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
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Telegram API Error:', response.status, response.statusText, errorBody);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}
