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
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  
  const country = headersList.get('x-vercel-ip-country') || 'N/A';
  const city = headersList.get('x-vercel-ip-city') || 'N/A';
  const region = headersList.get('x-vercel-ip-country-region') || 'N/A';
  const languages = headersList.get('accept-language')?.split(',')[0] || 'N/A';

  const location = [city, region, country].filter(part => part && part !== 'N/A').join(', ');

  const message = `🚀 *Новая сессия*

*Устройство*: \`${userAgent}\`
*IP-адрес*: \`${ip}\`
*Местоположение*: \`${location || 'N/A'}\`
*Языки*: \`${languages}\``;

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
        const result = await response.json();
        console.error('Telegram API Error:', result.description);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}


export async function sendProgressUpdateNotification(progress: {
  remainingTime: string;
  balance: number;
  robotName: string | null;
  isRunning: boolean;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is not configured in the .env file.');
    return;
  }

  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  
  const { remainingTime, balance, robotName, isRunning } = progress;

  const status = isRunning ? '✅ Работает' : '⏸️ На паузе';
  const robot = robotName || 'Не выбран';
  
  const formattedBalance = balance.toLocaleString('ru-RU', { style: 'currency', currency: 'USD' });

  const message = `📈 *Обновление сессии*

*IP-адрес*: \`${ip}\`
*Баланс*: \`${formattedBalance}\`
*Осталось времени*: \`${remainingTime}\`
*Выбранный робот*: \`${robot}\`
*Статус*: ${status}`;

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
        const result = await response.json();
        console.error('Telegram API Error (Progress Update):', result.description);
    }
  } catch (error) {
    console.error('Failed to send Telegram progress notification:', error);
  }
}
