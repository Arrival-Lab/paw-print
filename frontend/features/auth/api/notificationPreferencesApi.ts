import client from '../../../shared/api/client';

export interface NotificationPreferences {
  notifyVaccine: boolean;
  notifyCare: boolean;
}

export type NotificationPreferencesPatch = Partial<NotificationPreferences>;

export const notificationPreferencesApi = {
  get: () => client.get<NotificationPreferences>('/api/users/me/notification-preferences'),
  patch: (data: NotificationPreferencesPatch) =>
    client.patch<NotificationPreferences>('/api/users/me/notification-preferences', data),
};
