import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';

export interface DispatchNotificationInput {
  recipient_user_id: string; // Auth User ID
  template_code: string; // e.g. BOOKING_CONFIRMED, VACCINE_DUE, RX_DISPENSED, CRITICAL_LAB_ALERT
  title: string;
  body: string;
  channels?: Array<'in_app' | 'email' | 'sms' | 'push'>;
}

export const notificationService = {
  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) console.warn('[NotificationService] Preferences fetch notice:', error.message);

    // Return defaults if preference row not created yet
    return (
      data || {
        in_app_enabled: true,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        booking_reminders: true,
        health_passport_alerts: true,
      }
    );
  },

  /**
   * Multi-channel notification dispatcher
   */
  async dispatchNotification(input: DispatchNotificationInput) {
    const prefs = await this.getUserPreferences(input.recipient_user_id);
    const targetChannels = input.channels || ['in_app', 'email'];

    const logPromises = [];

    // 1. Dispatch In-App Notification if enabled
    if (targetChannels.includes('in_app') && prefs.in_app_enabled) {
      logPromises.push(
        supabase.from('notifications').insert({
          user_id: input.recipient_user_id,
          title: input.title,
          message: input.body,
          read: false,
        })
      );

      logPromises.push(
        supabase.from('communication_logs').insert({
          recipient_id: input.recipient_user_id,
          channel: 'in_app',
          template_code: input.template_code,
          title: input.title,
          body: input.body,
          status: 'sent',
        })
      );
    }

    // 2. Dispatch Email Notification if enabled
    if (targetChannels.includes('email') && prefs.email_enabled) {
      logPromises.push(
        supabase.from('communication_logs').insert({
          recipient_id: input.recipient_user_id,
          channel: 'email',
          template_code: input.template_code,
          title: input.title,
          body: input.body,
          status: 'sent',
        })
      );
    }

    await Promise.all(logPromises);
    return true;
  },
};
