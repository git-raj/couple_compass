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
  BellIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import ProfileDropdown from '@/components/profile/ProfileDropdown'
import RelationshipTips from '@/components/dashboard/RelationshipTips'
import { useNotifications } from '@/contexts/NotificationContext'

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

function QuickActionCard({ title, description, href, icon: Icon, color, onClick }: {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: string
  onClick?: () => void
}) {
  const content = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )

  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [moodStreak, setMoodStreak] = useState<{current_streak: number, longest_streak: number} | null>(null)
  const [showTips, setShowTips] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const { pendingInvitations, notifications, unreadCount, invitationCount } = useNotifications()

  // Get API base URL - use consistent approach with login page
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
    const initializeDashboard = async () => {
      try {
        // Check authentication
        const token = localStorage.getItem('access_token')
        const userData = localStorage.getItem('user')

        if (!token) {
          setLoading(false)
          router.push('/login')
          return
        }

        if (!userData) {
          console.error('No user data found')
          setLoading(false)
          router.push('/login')
          return
        }

        let parsedUser
        try {
          parsedUser = JSON.parse(userData)
          
          // Validate user data structure - only check for essential fields
          if (!parsedUser || !parsedUser.id || !parsedUser.email) {
            console.error('Invalid user data structure:', parsedUser)
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            setLoading(false)
            router.push('/login')
            return
          }
          
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          setLoading(false)
          router.push('/login')
          return
        }

        // Fetch mood streak data (don't let this block the dashboard loading)
        try {
          await fetchMoodStreak()
        } catch (error) {
          console.error('Error fetching mood streak:', error)
          // Don't block dashboard loading if mood streak fails
        }
        
      } catch (error) {
        console.error('Dashboard initialization error:', error)
        setLoading(false)
        router.push('/login')
        return
      }
      
      // Set loading to false after everything is complete
      setLoading(false)
    }

    initializeDashboard()
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
    <>
      {/* Tips Modal */}
      {showTips && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <RelationshipTips onClose={() => setShowTips(false)} />
          </div>
        </div>
      )}

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
                {/* Notification Bell */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2"
                  >
                    <BellIcon className="w-5 h-5 text-gray-600" />
                    {(unreadCount > 0 || invitationCount > 0) && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount + invitationCount > 9 ? '9+' : unreadCount + invitationCount}
                      </span>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {/* Pending Invitations */}
                        {pendingInvitations.length > 0 && (
                          <div className="p-4 border-b border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Chat Invitations</h4>
                            {pendingInvitations.map(invitation => (
                              <div key={invitation.id} className="p-3 bg-blue-50 rounded-lg mb-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {invitation.inviter_name} invited you to chat
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                      {new Date(invitation.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <Link 
                                    href="/chat"
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    onClick={() => setShowNotifications(false)}
                                  >
                                    View
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recent Notifications */}
                        {notifications.length > 0 ? (
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                            {notifications.slice(0, 5).map(notification => (
                              <div key={notification.id} className="p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-start space-x-2">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.read ? 'bg-gray-300' : 'bg-blue-500'
                                  }`} />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.timestamp.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : pendingInvitations.length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <ProfileDropdown user={user} onLogout={handleLogout} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickActionCard
                title="Get Tips"
                description="Get personalized relationship advice based on your interactions"
                href="#"
                icon={SparklesIcon}
                color="text-purple-600"
                onClick={() => setShowTips(true)}
              />
              <div className="relative">
                <QuickActionCard
                  title="Start AI Chat"
                  description="Get personalized relationship advice and guidance"
                  href="/chat"
                  icon={ChatBubbleLeftRightIcon}
                  color="text-blue-600"
                />
                {invitationCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {invitationCount > 9 ? '9+' : invitationCount}
                  </div>
                )}
              </div>
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
                href="/quiz"
                icon={SparklesIcon}
                color="text-orange-600"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
              {invitationCount > 0 && (
                <Link href="/chat">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {invitationCount} Invitation{invitationCount > 1 ? 's' : ''}
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Show chat invitations first */}
              {pendingInvitations.slice(0, 2).map(invitation => (
                <div key={invitation.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      {invitation.inviter_name} invited you to join a chat session
                    </p>
                    <p className="text-xs text-blue-600">
                      {new Date(invitation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link href="/chat">
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-600">
                      View
                    </Button>
                  </Link>
                </div>
              ))}

              {/* Show recent notifications */}
              {notifications.slice(0, 3 - Math.min(2, pendingInvitations.length)).map(notification => (
                <div key={notification.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'invitation' ? 'bg-blue-100' :
                    notification.type === 'success' ? 'bg-green-100' :
                    notification.type === 'message' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    <ChatBubbleLeftRightIcon className={`w-5 h-5 ${
                      notification.type === 'invitation' ? 'text-blue-600' :
                      notification.type === 'success' ? 'text-green-600' :
                      notification.type === 'message' ? 'text-purple-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              {/* Default activities if no notifications */}
              {notifications.length === 0 && pendingInvitations.length === 0 && (
                <>
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
                </>
              )}
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
    </>
  )
}
