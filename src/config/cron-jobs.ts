import cron from 'node-cron';
import axios from 'axios';
import { setTimeout } from 'timers/promises';
import * as dotenv from "dotenv";
dotenv.config()

// Configuration
const API_BASE_URL = 'https://chore-economy-app.onrender.com/api/v1';
const CRON_SECRET = process.env.CRON_SECRET_KEY || 'your-secret-key-here';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000;

const JOBS = [
  {
    name: 'Savings Reminders',
    endpoint: '/savings/savings-reminders',
    schedule: '0 12 * * *',
    logPrefix: 'Savings'
  },
  {
    name: 'Payment Checker',
    endpoint: '/payments/check-due-payments',
    schedule: '0 12 * * *',
    logPrefix: 'Payments'
  }
];

// Secure request handler with retry logic
const makeSecureApiRequest = async (endpoint: string, jobName: string) => {
  let attempt = 0;
  let lastError = null;
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🔍 Testing endpoint: ${url}`);

  while (attempt < MAX_RETRIES) {
    attempt++;
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'X-Cron-Secret': CRON_SECRET,
          'X-Job-Name': jobName,
          'User-Agent': 'SecureCron/1.0'
        }
      });

      console.log(`⚡ Response time: ${Date.now() - startTime}ms`); // New metric
      return {
        success: true,
        data: response,
        status: response.status,
        attempts: attempt,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      lastError = error;
      
      // Don't retry for 401/403 (authentication errors)
      if ([401, 403].includes(error.response?.status)) {
        return {
          success: false,
          error: 'Authentication failed - check CRON_SECRET',
          attempts: attempt
        };
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(`⚠️ ${jobName} attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await setTimeout(delay);
      }
    }
  }

  return {
    success: false,
    error: lastError?.response?.data || lastError?.message || 'Unknown error',
    attempts: attempt
  };
};

// Initialize secured jobs
JOBS.forEach(({ name, endpoint, schedule, logPrefix }) => {
  cron.schedule(schedule, async () => {
    console.log(`\n[${new Date().toISOString()}] Starting secured job: ${name}`);

    const result = await makeSecureApiRequest(endpoint, name);

    if (result.success) {
      console.log(`${logPrefix} succeeded after ${result.attempts} attempt(s)`);
    } else {
      console.error(`${logPrefix} FAILED:`, result.error);
      if (result.error.includes('Authentication failed')) {
        process.exit(1); // Critical failure for auth errors
      }
    }
  });
});

// Security notes
console.log(`
🔒 Security Configuration:
- Using X-Cron-Secret: ${CRON_SECRET ? '*** (set)' : 'NOT SET - WARNING'}
- Requests timeout after ${REQUEST_TIMEOUT / 1000}s
- Max retries: ${MAX_RETRIES}
`);

process.on('SIGINT', () => process.exit(0));