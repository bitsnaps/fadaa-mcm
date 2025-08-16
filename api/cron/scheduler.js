const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

// Schedule the task to run once a day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily contract termination cron job...');
  const child = spawn('node', [path.join(__dirname, 'terminate-expired-contracts.js')]);

  child.stdout.on('data', (data) => {
    console.log(`Cron job output: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`Cron job error: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`Cron job finished with code ${code}`);
  });
});

console.log('Cron scheduler started. Expired contracts will be terminated daily at midnight.');

// Schedule the task to run once a day at 1 AM
cron.schedule('0 1 * * *', () => {
  console.log('Running daily expiring investment check cron job...');
  const child = spawn('node', [path.join(__dirname, 'check-expiring-investments.js')]);

  child.stdout.on('data', (data) => {
    console.log(`Cron job output: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`Cron job error: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`Cron job finished with code ${code}`);
  });
});