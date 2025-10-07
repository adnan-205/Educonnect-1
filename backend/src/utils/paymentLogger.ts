import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'payment-callbacks.log');

function ensureDir() {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch {}
}

export function logPaymentEvent(event: string, payload: any) {
  try {
    ensureDir();
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      payload,
    }) + '\n';
    fs.appendFileSync(logFile, line, { encoding: 'utf8' });
  } catch (e) {
    // swallow logging errors to avoid breaking flow
  }
}

export default { logPaymentEvent };
