import { readFile } from 'node:fs/promises';

const credentials = JSON.parse(await readFile('/tmp/meta-credentials.json', 'utf8'));
const credential = credentials.find((item) => item.id === '0YLUNyZwoc9ckz91');
if (!credential) throw new Error('No se encontró la credencial de envío.');

const accessToken = credential.data.accessToken;
if (!accessToken) throw new Error(`No se encontró accessToken; campos disponibles: ${Object.keys(credential.data).join(', ')}`);
const wabaId = '2617062035431137';
const response = await fetch(`https://graph.facebook.com/v26.0/${wabaId}/subscribed_apps?access_token=${encodeURIComponent(accessToken)}`);
const payload = await response.json();
console.log(JSON.stringify({ status: response.status, data: payload.data ?? null, error: payload.error?.message ?? null }));
