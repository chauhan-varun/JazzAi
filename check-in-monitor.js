/**
 * Script to monitor check-in jobs
 */

import cron from 'node-cron';
import config from './config/config.mongo.js';

// Override config for testing
config.scheduler.checkInSchedule = '* * * * *'; // Run every minute
config.memory.inactivityThreshold = 1; // Check-in after 1 minute of inactivity

console.log('Starting check-in job monitor...');
console.log(`Check-in schedule: ${config.scheduler.checkInSchedule}`);
console.log(`Inactivity threshold: ${config.memory.inactivityThreshold} minute(s)`);

// Print current time
const startTime = new Date();
console.log(`Current time: ${startTime.toLocaleTimeString()}`);
console.log(`The job should run at the start of each minute`);

// Create a job with the same schedule
const checkInJob = cron.schedule(config.scheduler.checkInSchedule, () => {
  const now = new Date();
  console.log(`⏰ Check-in job would run at: ${now.toLocaleTimeString()}`);
});

console.log('Monitor started. Press Ctrl+C to stop.');

// Calculate time until next minute
const nextMinute = new Date(startTime);
nextMinute.setMinutes(startTime.getMinutes() + 1);
nextMinute.setSeconds(0);
nextMinute.setMilliseconds(0);

const msUntilNextMinute = nextMinute.getTime() - startTime.getTime();
console.log(`Next job should run in approximately ${Math.round(msUntilNextMinute / 1000)} seconds`);