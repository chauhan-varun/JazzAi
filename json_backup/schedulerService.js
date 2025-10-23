/**
 * Scheduler Service
 * Handles automatic check-in messages and scheduled tasks
 */

import cron from 'node-cron';
import config from '../config/config.js';
import whatsappService from './whatsappService.js';
import memoryService from './memoryService.js';

class SchedulerService {
  constructor() {
    this.checkInJob = null;
  }

  /**
   * Initialize and start all scheduled jobs
   */
  initialize() {
    this.startCheckInJob();
    console.log('Scheduler initialized with check-in schedule:', config.scheduler.checkInSchedule);
  }

  /**
   * Start the regular check-in job
   */
  startCheckInJob() {
    try {
      // Stop any existing job
      if (this.checkInJob) {
        this.checkInJob.stop();
      }

      // Schedule new job using the configured cron expression
      this.checkInJob = cron.schedule(config.scheduler.checkInSchedule, async () => {
        console.log('Running scheduled check-in job:', new Date().toISOString());
        
        try {
          const result = await whatsappService.sendCheckInMessage();
          console.log('Check-in job result:', JSON.stringify(result));
        } catch (error) {
          console.error('Error in check-in job:', error);
        }
      });

      console.log('Check-in job scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error scheduling check-in job:', error);
      return false;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    if (this.checkInJob) {
      this.checkInJob.stop();
      console.log('All scheduled jobs stopped');
    }
  }

  /**
   * Update check-in schedule
   */
  updateCheckInSchedule(newSchedule) {
    try {
      // Validate the cron expression
      if (!cron.validate(newSchedule)) {
        throw new Error('Invalid cron expression');
      }

      // Update the schedule in config
      config.scheduler.checkInSchedule = newSchedule;

      // Restart the job with the new schedule
      this.startCheckInJob();
      
      console.log('Check-in schedule updated:', newSchedule);
      return true;
    } catch (error) {
      console.error('Error updating check-in schedule:', error);
      return false;
    }
  }

  /**
   * Check if there are any pending reminders to send
   * This could be run at a higher frequency than check-ins
   */
  async checkPendingReminders() {
    try {
      const pendingReminders = await memoryService.getPendingReminders();
      const now = new Date();
      
      // Check for reminders that are due
      for (const reminder of pendingReminders) {
        const triggerTime = new Date(reminder.triggerTime);
        
        if (triggerTime <= now) {
          // Send the reminder
          await whatsappService.sendMessage(`🔔 Reminder: ${reminder.text}`);
          
          // Mark as completed
          await memoryService.completeReminder(reminder.id);
          
          console.log('Reminder sent and marked as completed:', reminder.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking pending reminders:', error);
      return false;
    }
  }
}

const schedulerService = new SchedulerService();
export default schedulerService;