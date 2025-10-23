/**
 * Scheduler Service - Multi-user version
 * Handles automatic check-in messages and scheduled tasks for multiple users
 */

import cron from 'node-cron';
import config from '../config/config.mongo.js';
import whatsappService from './whatsappService.mongo.js'; // Use MongoDB version
import { Logger } from '../utils/utils.mongo.js';

class SchedulerService {
  constructor() {
    this.checkInJob = null;
    this.reminderJob = null;
  }

  /**
   * Initialize and start all scheduled jobs
   */
  initialize() {
    this.startCheckInJob();
    this.startReminderJob();
    Logger.info('Scheduler initialized with multi-user support');
    Logger.info(`Check-in schedule: ${config.scheduler.checkInSchedule}`);
    Logger.info(`Reminder check schedule: ${config.scheduler.reminderCheckSchedule}`);
  }

  /**
   * Start the regular check-in job for all users
   */
  startCheckInJob() {
    try {
      // Stop any existing job
      if (this.checkInJob) {
        this.checkInJob.stop();
      }

      // Schedule new job using the configured cron expression
      this.checkInJob = cron.schedule(config.scheduler.checkInSchedule, async () => {
        Logger.info('Running scheduled check-in job for all users');
        
        try {
          // Send check-in messages to all eligible users
          const result = await whatsappService.sendCheckInMessages();
          Logger.info(`Check-in job completed: ${result.messagesSent} messages sent`);
        } catch (error) {
          Logger.error('Error in check-in job:', error);
        }
      });

      Logger.info('Check-in job scheduled successfully');
      return true;
    } catch (error) {
      Logger.error('Error scheduling check-in job:', error);
      return false;
    }
  }

  /**
   * Start the reminder check job
   */
  startReminderJob() {
    try {
      // Stop any existing job
      if (this.reminderJob) {
        this.reminderJob.stop();
      }

      // Schedule reminder check every 5 minutes
      const reminderSchedule = config.scheduler.reminderCheckSchedule || '*/5 * * * *';
      
      this.reminderJob = cron.schedule(reminderSchedule, async () => {
        Logger.info('Running reminder check job');
        
        try {
          // Check for pending reminders for all users
          await this.checkPendingRemindersForAllUsers();
        } catch (error) {
          Logger.error('Error in reminder job:', error);
        }
      });

      Logger.info('Reminder job scheduled successfully');
      return true;
    } catch (error) {
      Logger.error('Error scheduling reminder job:', error);
      return false;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    if (this.checkInJob) {
      this.checkInJob.stop();
    }
    if (this.reminderJob) {
      this.reminderJob.stop();
    }
    Logger.info('All scheduled jobs stopped');
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
      
      Logger.info(`Check-in schedule updated: ${newSchedule}`);
      return true;
    } catch (error) {
      Logger.error('Error updating check-in schedule:', error);
      return false;
    }
  }

  /**
   * Check for pending reminders for all users
   */
  async checkPendingRemindersForAllUsers() {
    try {
      // Get all users who have reminders
      const activeUsers = await whatsappService.getActiveUsers();
      let remindersSent = 0;
      
      for (const user of activeUsers) {
        try {
          // Import memory service here to avoid circular dependency
          const memoryService = (await import('./memoryService.mongo.js')).default;
          
          // Get pending reminders for this user
          const pendingReminders = await memoryService.getPendingReminders(user.phoneNumber);
          const now = new Date();
          
          // Check for reminders that are due
          for (const reminder of pendingReminders) {
            const triggerTime = new Date(reminder.triggerTime);
            
            if (triggerTime <= now) {
              // Send the reminder
              await whatsappService.sendMessage(`🔔 Reminder: ${reminder.text}`, user.phoneNumber);
              
              // Mark as completed
              await memoryService.completeReminder(reminder._id, user.phoneNumber);
              
              console.log(`Reminder sent to ${user.phoneNumber} and marked as completed:`, reminder._id);
              remindersSent++;
            }
          }
        } catch (error) {
          console.error(`Error checking reminders for user ${user.phoneNumber}:`, error);
          // Continue with next user
        }
      }
      
      if (remindersSent > 0) {
        console.log(`Sent ${remindersSent} reminders across all users`);
      }
      
      return {
        success: true,
        remindersSent
      };
    } catch (error) {
      console.error('Error checking pending reminders for all users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const schedulerService = new SchedulerService();
export default schedulerService;