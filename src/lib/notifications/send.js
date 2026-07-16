function textToHtml(message = '') {
  return String(message)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('\n', '<br />'))
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');
}

async function readProviderError(response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.message || json.error || text;
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

export async function sendResendEmail({ apiKey, from, to, subject, message }) {
  if (!apiKey) throw new Error('Resend API key is missing.');
  if (!from) throw new Error('Email sender address is missing.');
  if (!to) throw new Error('Email recipient is missing.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: subject || 'CartsVista notification',
      html: textToHtml(message),
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  return response.json();
}

export async function sendTwilioSms({ accountSid, authToken, from, to, message }) {
  if (!accountSid) throw new Error('Twilio Account SID is missing.');
  if (!authToken) throw new Error('Twilio Auth Token is missing.');
  if (!from) throw new Error('Twilio sender number is missing.');
  if (!to) throw new Error('SMS recipient is missing.');

  const params = new URLSearchParams({
    From: from,
    To: to,
    Body: message,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  return response.json();
}

export async function sendNotificationLog(notification, settings) {
  if (notification.channel === 'sms') {
    const response = await sendTwilioSms({
      accountSid: settings.twilioAccountSid,
      authToken: settings.twilioAuthToken,
      from: settings.twilioFromNumber,
      to: notification.recipient,
      message: notification.message,
    });

    return {
      provider: 'twilio',
      providerId: response.sid || null,
      response,
    };
  }

  const response = await sendResendEmail({
    apiKey: settings.resendApiKey,
    from: settings.emailFrom,
    to: notification.recipient,
    subject: notification.subject,
    message: notification.message,
  });

  return {
    provider: 'resend',
    providerId: response.id || null,
    response,
  };
}
