"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePostHogPrivacy } from '@/hooks/use-posthog';

interface PrivacySettings {
  analyticsEnabled: boolean;
  marketingEmails: boolean;
  dataRetention: boolean;
}

export function PrivacySettings() {
  const { user } = useUser();
  const { optOut, optIn, isOptedOut } = usePostHogPrivacy();
  const [settings, setSettings] = useState<PrivacySettings>({
    analyticsEnabled: true,
    marketingEmails: true,
    dataRetention: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/user/privacy-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user?.id]);

  const handleAnalyticsToggle = async (enabled: boolean) => {
    if (enabled) {
      optIn();
    } else {
      optOut();
    }

    await updateSettings({ analyticsEnabled: enabled });
  };

  const handleMarketingToggle = async (enabled: boolean) => {
    await updateSettings({ marketingEmails: enabled });
  };

  const handleRetentionToggle = async (enabled: boolean) => {
    await updateSettings({ dataRetention: enabled });
  };

  const updateSettings = async (updates: Partial<PrivacySettings>) => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      const response = await fetch('/api/user/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Control how your data is used to improve your learning experience.
        </p>
      </div>

      <div className="space-y-4">
        {/* Analytics Tracking */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Analytics & Usage Tracking</h4>
            <p className="text-sm text-gray-600 mt-1">
              Help us improve the platform by sharing anonymous usage data. This includes
              page views, feature usage, and performance metrics.
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={() => handleAnalyticsToggle(!settings.analyticsEnabled)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                settings.analyticsEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Marketing Emails */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Marketing Communications</h4>
            <p className="text-sm text-gray-600 mt-1">
              Receive emails about new courses, platform updates, and learning tips.
              You can unsubscribe at any time.
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={() => handleMarketingToggle(!settings.marketingEmails)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                settings.marketingEmails ? 'bg-indigo-600' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Retention */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Data Retention</h4>
            <p className="text-sm text-gray-600 mt-1">
              Allow us to retain your learning data for personalized recommendations
              and progress tracking. Data is encrypted and stored securely.
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={() => handleRetentionToggle(!settings.dataRetention)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                settings.dataRetention ? 'bg-indigo-600' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.dataRetention ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Your Privacy Matters</h4>
            <p className="text-sm text-blue-700 mt-1">
              We are committed to protecting your privacy. All data is processed in accordance
              with our Privacy Policy and applicable data protection laws. You can change
              these settings at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export/Deletion */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Data Management</h4>
        <div className="space-y-3">
          <button
            onClick={() => {
              // TODO: Implement data export
              alert('Data export feature coming soon');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Export my data
          </button>
          <span className="text-gray-300 mx-2">•</span>
          <button
            onClick={() => {
              // TODO: Implement account deletion
              alert('Account deletion feature coming soon');
            }}
            className="text-sm text-red-600 hover:text-red-500"
          >
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}