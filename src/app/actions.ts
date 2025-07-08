'use server';

import { headers } from 'next/headers';

export async function sendTelegramNotification() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    console.error('Telegram bot token or chat ID is not configured. Please check your .env file.');
    return;
  }

  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'N/A';
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  
  const message = `🚀 New Session Started
---
User Agent: ${userAgent}
IP Address: ${ip}`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
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
