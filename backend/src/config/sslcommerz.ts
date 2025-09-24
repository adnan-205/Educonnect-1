import SSLCommerzPayment from 'sslcommerz-lts';

const store_id = process.env.SSL_STORE_ID as string;
const store_passwd = process.env.SSL_STORE_PASS as string;
// Use env flag or default to false (sandbox)
const is_live = (process.env.SSL_IS_LIVE || 'false') === 'true';

// Fallbacks/guards
if (!store_id || !store_passwd) {
  // Do not throw at import-time to avoid crashing server startup without envs in some environments
  console.warn('[SSLCommerz] Missing SSL_STORE_ID or SSL_STORE_PASS environment variables');
}

// sslcommerz-lts has no TS types exported; cast to any to avoid type errors
const sslcz = new (SSLCommerzPayment as any)(store_id, store_passwd, is_live);
export default sslcz;
