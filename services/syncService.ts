import { UserProfile, Theme } from '../types';

const STORAGE_KEY = 'lumina_user_profile';
const MOCK_CLOUD_DELAY = 1000;

// Default initial state
const defaultProfile: UserProfile = {
  preferences: {
    theme: 'light',
  },
  progress: {
    completedDates: [],
  },
  lastSyncedAt: Date.now(),
};

class SyncService {
  // Simulate network request to cloud
  private async mockCloudRequest<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), MOCK_CLOUD_DELAY);
    });
  }

  // Load data (Try local first, then "cloud" in a real app)
  async loadData(): Promise<UserProfile> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return defaultProfile;
    } catch (error) {
      console.error('Error loading local data:', error);
      return defaultProfile;
    }
  }

  // Save data to local storage and simulate cloud push
  async saveData(profile: UserProfile): Promise<void> {
    try {
      const updatedProfile = {
        ...profile,
        lastSyncedAt: Date.now(),
      };
      
      // 1. Save Local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      
      // 2. Sync to Cloud (Mocked)
      // In a real implementation, this would be: await firebase.firestore().collection('users').doc(userId).set(updatedProfile);
      await this.mockCloudRequest(updatedProfile);
      
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  // Merge strategy for conflict resolution (simple union for arrays)
  mergeProfiles(local: UserProfile, cloud: UserProfile): UserProfile {
    const mergedDates = Array.from(new Set([
      ...local.progress.completedDates,
      ...cloud.progress.completedDates
    ]));

    // Prefer cloud theme if newer, otherwise local
    const useCloudSettings = cloud.lastSyncedAt > local.lastSyncedAt;

    return {
      preferences: {
        theme: useCloudSettings ? cloud.preferences.theme : local.preferences.theme,
      },
      progress: {
        completedDates: mergedDates,
      },
      lastSyncedAt: Date.now(),
    };
  }
}

export const syncService = new SyncService();
