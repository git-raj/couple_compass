'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HeartIcon, ChartBarIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface HealthStatus {
  status: string
  timestamp: number
  version: string
}

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        const data = await response.json()
        setHealthStatus(data)
      } catch (err) {
        setError('Backend connection failed')
      } finally {
        setLoading(false)
      }
    }

    checkBackendHealth()
  }, [])

  const features = [
    {
      icon: HeartIcon,
      title: 'Daily Mood Check-ins',
      description: 'Track your relationship mood with simple, meaningful check-ins that help you understand patterns.'
    },
    {
      icon: ChartBarIcon,
      title: 'Relationship Insights',
      description: 'Get personalized insights based on your interactions, moods, and communication patterns.'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Couple Quizzes',
      description: 'Discover your love languages, communication styles, and areas for growth together.'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Tips',
      description: 'Receive personalized relationship advice and tips tailored to your unique situation.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🧭</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Couple Compass</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Navigate Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                  {' '}Relationship{' '}
                </span>
                Journey
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Strengthen your bond with personalized insights, mood tracking, and expert guidance 
                designed specifically for couples.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                Start Your Journey
              </Link>
              <Link href="/demo" className="btn-secondary text-lg px-8 py-4">
                See How It Works
              </Link>
            </motion.div>

            {/* Backend Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              {loading && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Connecting to services...
                </div>
              )}
              
              {error && (
                <div className="inline-flex items-center px-4 py-2 bg-red-50 rounded-full text-red-600">
                  <span className="mr-2">❌</span>
                  {error}
                </div>
              )}
              
              {healthStatus && (
                <div className="inline-flex items-center px-4 py-2 bg-green-50 rounded-full text-green-600">
                  <span className="mr-2">✅</span>
                  All systems operational (v{healthStatus.version})
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to grow together
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our comprehensive platform provides tools and insights to help you build a stronger, 
                more connected relationship.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to strengthen your relationship?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of couples who are already building stronger connections.
              </p>
              <Link href="/signup" className="inline-block bg-white text-primary-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg transition-colors duration-200">
                Get Started Free
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🧭</span>
              </div>
              <span className="text-xl font-bold">Couple Compass</span>
            </div>
            <div className="text-sm text-gray-400">
              <p>&copy; 2024 Couple Compass. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
