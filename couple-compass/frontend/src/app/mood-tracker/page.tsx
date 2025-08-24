'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import MoodTracker from '@/components/dashboard/MoodTracker';

const MoodTrackerPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <HeartIcon className="w-6 h-6 text-pink-600" />
              <span className="text-xl font-bold text-gray-900">Daily Mood Check</span>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Mood Tracking
          </h1>
          <p className="text-lg text-gray-600">
            Take a moment to reflect on your feelings and track your emotional well-being over time.
          </p>
        </div>

        {/* Mood Tracker Component */}
        <div className="max-w-2xl mx-auto">
          <MoodTracker />
        </div>

        {/* Tips Section */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Daily Mood Check Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track emotional patterns over time</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Identify triggers and influences</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Monitor relationship satisfaction</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Build self-awareness habits</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Share insights with your partner</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Celebrate positive progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MoodTrackerPage;
