'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  HeartIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  SparklesIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface User {
  id: number
  name: string
  email: string
  onboarding_completed: boolean
}

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: string
}

function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, href, icon: Icon, color }: {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')} mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [moodStreak, setMoodStreak] = useState<{current_streak: number, longest_streak: number} | null>(null)

  // Get API base URL
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api/v1' 
        : 'https://api.couplecompass.com/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  };

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const fetchMoodStreak = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${getApiUrl()}/mood/streak`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const streak = await response.json();
        setMoodStreak(streak);
      }
    } catch (error) {
      console.error('Error fetching mood streak:', error);
    }
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')

    if (!token) {
      router.push('/login')
      return
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
        return
      }
    }

    // Fetch mood streak data
    fetchMoodStreak()

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🧭</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Couple Compass</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserCircleIcon className="w-5 h-5" />
                <span>{user.name || 'User'}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user.name ? user.name.split(' ')[0] : 'there'}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to your relationship dashboard. Let's continue building stronger connections together.
          </p>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Mood Streak"
            value={moodStreak ? `${moodStreak.current_streak} day${moodStreak.current_streak !== 1 ? 's' : ''}` : '0 days'}
            subtitle={moodStreak && moodStreak.current_streak > 0 ? 'Keep it going!' : 'Start tracking today!'}
            icon={HeartIcon}
            color="text-pink-600"
          />
          <StatsCard
            title="Chat Sessions"
            value="12"
            subtitle="This month"
            icon={ChatBubbleLeftRightIcon}
            color="text-blue-600"
          />
          <StatsCard
            title="Relationship Score"
            value="85%"
            subtitle="Great progress!"
            icon={ChartBarIcon}
            color="text-green-600"
          />
          <StatsCard
            title="Tips Followed"
            value="23"
            subtitle="All time"
            icon={SparklesIcon}
            color="text-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Start AI Chat"
              description="Get personalized relationship advice and guidance"
              href="/chat"
              icon={ChatBubbleLeftRightIcon}
              color="text-blue-600"
            />
            <QuickActionCard
              title="Daily Mood Check"
              description="Track how you're feeling about your relationship"
              href="/mood-tracker"
              icon={HeartIcon}
              color="text-pink-600"
            />
            <QuickActionCard
              title="Take a Quiz"
              description="Discover insights about your relationship style"
              href="/quizzes"
              icon={SparklesIcon}
              color="text-purple-600"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Started a conversation about communication</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Completed daily mood check-in</p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Completed profile setup</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline">View All Activity</Button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-100">
          <div className="flex items-center space-x-3 mb-4">
            <CalendarDaysIcon className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">Upcoming</h3>
          </div>
          <p className="text-gray-600 mb-4">
            No upcoming anniversaries or special dates. Add important dates in your profile to see them here!
          </p>
          <Link href="/profile-setup">
            <Button className="bg-primary-600 hover:bg-primary-700">
              Update Profile
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
