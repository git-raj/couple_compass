'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MoodCheckin {
  id: number;
  user_id: string;
  couple_id?: string;
  mood_level: number;
  notes?: string;
  context_tags?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface MoodStats {
  average_mood: number;
  total_entries: number;
  mood_distribution: Record<number, number>;
  recent_trend: string;
}

const moodEmojis = {
  1: { emoji: '😢', label: 'Very Unhappy', color: 'text-red-600' },
  2: { emoji: '😔', label: 'Unhappy', color: 'text-orange-600' },
  3: { emoji: '😐', label: 'Neutral', color: 'text-yellow-600' },
  4: { emoji: '😊', label: 'Happy', color: 'text-green-600' },
  5: { emoji: '😄', label: 'Very Happy', color: 'text-emerald-600' }
};

const trendColors = {
  improving: 'text-green-600',
  declining: 'text-red-600',
  stable: 'text-blue-600'
};

const trendIcons = {
  improving: '📈',
  declining: '📉',
  stable: '📊'
};

const contextTags = [
  { id: 'work', label: 'Work', color: 'bg-blue-100 text-blue-800' },
  { id: 'relationship', label: 'Relationship', color: 'bg-pink-100 text-pink-800' },
  { id: 'family', label: 'Family', color: 'bg-green-100 text-green-800' },
  { id: 'health', label: 'Health', color: 'bg-red-100 text-red-800' },
  { id: 'social', label: 'Social', color: 'bg-purple-100 text-purple-800' },
  { id: 'personal', label: 'Personal', color: 'bg-indigo-100 text-indigo-800' }
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [todayMood, setTodayMood] = useState<MoodCheckin | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodCheckin[]>([]);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [totalMoodCount, setTotalMoodCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMoods, setHasMoreMoods] = useState(true);

  // Get API base URL - use consistent approach with other components
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  };

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  useEffect(() => {
    fetchTodayMood();
    fetchMoodStats();
  }, []);

  const fetchTodayMood = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${getApiUrl()}/mood/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const mood = await response.json();
        setTodayMood(mood);
        if (mood) {
          setSelectedMood(mood.mood_level);
          setNotes(mood.notes || '');
          if (mood.context_tags) {
            setSelectedTags(Object.keys(mood.context_tags).filter(tag => mood.context_tags[tag]));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching today\'s mood:', error);
    }
  };

  const fetchMoodHistory = async (offset = 0, append = false) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${getApiUrl()}/mood/history?days=30&limit=5&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (append) {
          setMoodHistory(prev => [...prev, ...data.moods]);
        } else {
          setMoodHistory(data.moods);
        }
        setTotalMoodCount(data.total_count);
        setHasMoreMoods(data.moods.length === 5 && (offset + 5) < data.total_count);
      }
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const loadMoreMoods = async () => {
    if (loadingMore || !hasMoreMoods) return;
    
    setLoadingMore(true);
    const newOffset = historyOffset + 5;
    await fetchMoodHistory(newOffset, true);
    setHistoryOffset(newOffset);
    setLoadingMore(false);
  };

  const fetchMoodStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${getApiUrl()}/mood/stats?days=30`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setMoodStats(stats);
      }
    } catch (error) {
      console.error('Error fetching mood stats:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const submitMood = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const contextTags = selectedTags.reduce((acc, tag) => {
        acc[tag] = true;
        return acc;
      }, {} as Record<string, boolean>);

      const response = await fetch(`${getApiUrl()}/mood/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_level: selectedMood,
          notes: notes.trim() || null,
          context_tags: Object.keys(contextTags).length > 0 ? contextTags : null
        }),
      });

      if (response.ok) {
        const newMood = await response.json();
        setTodayMood(newMood);
        await fetchMoodStats();
        // Show success feedback
        alert(todayMood ? 'Mood updated successfully!' : 'Mood saved successfully!');
        
        // Trigger a refresh of the parent component if it exists
        if (typeof window !== 'undefined' && window.parent !== window) {
          window.parent.postMessage({ type: 'mood_updated' }, '*');
        }
      } else {
        const error = await response.text();
        console.error('Error response:', error);
        alert('Failed to save mood. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting mood:', error);
      alert('Failed to save mood. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      setHistoryOffset(0);
      fetchMoodHistory(0, false);
    } else {
      // Reset pagination state when hiding
      setMoodHistory([]);
      setHistoryOffset(0);
      setHasMoreMoods(true);
    }
    setShowHistory(!showHistory);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Mood Check</h2>
        {moodStats && moodStats.total_entries > 0 && (
          <div className={`flex items-center space-x-2 ${trendColors[moodStats.recent_trend as keyof typeof trendColors]}`}>
            <span>{trendIcons[moodStats.recent_trend as keyof typeof trendIcons]}</span>
            <span className="text-sm font-medium capitalize">
              {moodStats.recent_trend}
            </span>
          </div>
        )}
      </div>

      {/* Last Mood Update Display */}
      {todayMood && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <span className="mr-2">📝</span>
            Last Mood Update
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {moodEmojis[todayMood.mood_level as keyof typeof moodEmojis]?.emoji}
              </div>
              <div>
                <div className="font-medium text-gray-800">
                  {moodEmojis[todayMood.mood_level as keyof typeof moodEmojis]?.label}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(todayMood.updated_at)}
                </div>
                {todayMood.context_tags && Object.keys(todayMood.context_tags).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(todayMood.context_tags).filter(tag => todayMood.context_tags![tag]).map(tag => {
                      const tagInfo = contextTags.find(t => t.id === tag);
                      return (
                        <span key={tag} className={`px-2 py-0.5 rounded-full text-xs ${tagInfo?.color || 'bg-gray-200 text-gray-700'}`}>
                          {tagInfo?.label || tag}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {todayMood.notes && (
              <div className="text-sm text-gray-600 max-w-xs">
                <div className="font-medium mb-1">Notes:</div>
                <div className="italic">"{todayMood.notes}"</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mood Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          How are you feeling today?
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(moodEmojis).map(([level, mood]) => (
            <button
              key={level}
              onClick={() => setSelectedMood(Number(level))}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                selectedMood === Number(level)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <div className={`text-xs font-medium ${mood.color}`}>
                {mood.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Context Tags */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">What's affecting your mood? (Optional)</h4>
        <div className="flex flex-wrap gap-2">
          {contextTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTags.includes(tag.id)
                  ? tag.color + ' ring-2 ring-offset-1 ring-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Optional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
          placeholder="How was your day? What made you feel this way?"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={submitMood}
        disabled={!selectedMood || loading}
        className="w-full mb-4"
      >
        {loading ? 'Saving...' : (todayMood ? 'Update Mood' : 'Save Mood')}
      </Button>

      {/* Stats Section */}
      {moodStats && moodStats.total_entries > 0 && (
        <div className="border-t pt-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {moodStats.average_mood.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Mood</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {moodStats.total_entries}
              </div>
              <div className="text-sm text-gray-600">Entries</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${trendColors[moodStats.recent_trend as keyof typeof trendColors]}`}>
                {trendIcons[moodStats.recent_trend as keyof typeof trendIcons]}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {moodStats.recent_trend}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Toggle */}
      <Button
        onClick={toggleHistory}
        variant="outline"
        className="w-full"
      >
        {showHistory ? 'Hide History' : 'Show Recent History'}
      </Button>

      {/* Mood History */}
      {showHistory && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700">Recent Mood History</h4>
            {totalMoodCount > 0 && (
              <span className="text-sm text-gray-500">
                Showing {moodHistory.length} of {totalMoodCount} entries
              </span>
            )}
          </div>
          
          {moodHistory.length > 0 ? (
            <div className="space-y-3">
              {moodHistory.map((mood) => (
                <div key={mood.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {moodEmojis[mood.mood_level as keyof typeof moodEmojis]?.emoji}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {moodEmojis[mood.mood_level as keyof typeof moodEmojis]?.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(mood.created_at)}
                      </div>
                      {mood.context_tags && Object.keys(mood.context_tags).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.keys(mood.context_tags).filter(tag => mood.context_tags![tag]).map(tag => {
                            const tagInfo = contextTags.find(t => t.id === tag);
                            return (
                              <span key={tag} className={`px-2 py-0.5 rounded-full text-xs ${tagInfo?.color || 'bg-gray-200 text-gray-700'}`}>
                                {tagInfo?.label || tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {mood.notes && (
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      "{mood.notes}"
                    </div>
                  )}
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMoreMoods && (
                <div className="text-center pt-3">
                  <Button
                    onClick={loadMoreMoods}
                    disabled={loadingMore}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {loadingMore ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      `Show More (${Math.min(5, totalMoodCount - moodHistory.length)} more)`
                    )}
                  </Button>
                </div>
              )}
              
              {/* All loaded message */}
              {!hasMoreMoods && moodHistory.length > 5 && (
                <div className="text-center pt-3">
                  <p className="text-sm text-gray-500">
                    All mood entries loaded
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No mood entries yet. Start tracking today!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
