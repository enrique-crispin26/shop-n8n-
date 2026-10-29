import { readFile } from 'node:fs/promises';

const credentials = JSON.parse(await readFile('/tmp/meta-credentials.json', 'utf8'));
const credential = credentials.find((item) => item.id === 'CbPZL7MHlvbTHmrt');
if (!credential) throw new Error('No se encontró la credencial del disparador.');

const { clientId, clientSecret } = credential.data;
const accessToken = `${clientId}|${clientSecret}`;
const response = await fetch(`https://graph.facebook.com/v26.0/${clientId}/subscriptions?access_token=${encodeURIComponent(accessToken)}`);
const payload = await response.json();
if (!response.ok) throw new Error(JSON.stringify(payload));

const subscriptions = (payload.data ?? []).map(({ object, callback_url, fields }) => ({ object, callback_url, fields }));
console.log(JSON.stringify(subscriptions));
