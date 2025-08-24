'use client'

import Link from 'next/link'
import { HeartIcon, ChartBarIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function DemoPage() {
  const demoFeatures = [
    {
      icon: HeartIcon,
      title: 'Daily Mood Check-ins',
      description: 'Track your relationship mood with simple, meaningful check-ins.',
      demoContent: 'Select your mood: Happy, Content, Neutral, Stressed, Concerned'
    },
    {
      icon: ChartBarIcon,
      title: 'Relationship Insights',
      description: 'Get personalized insights based on your patterns.',
      demoContent: 'Your relationship happiness has improved 15% this month!'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Couple Quizzes',
      description: 'Discover your love languages and communication styles.',
      demoContent: 'Quiz: "What\'s your love language?" - Words of Affirmation, Quality Time...'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Tips',
      description: 'Receive personalized relationship advice.',
      demoContent: 'Tip: Try planning a surprise date night to strengthen your bond!'
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
            <nav className="flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Back to Home
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See Couple Compass 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
              {' '}in Action
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore how our features work together to help you build a stronger, more connected relationship.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {demoFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                <p className="text-sm text-gray-700 font-medium">
                  Demo Preview:
                </p>
                <p className="text-gray-600 mt-1">
                  {feature.demoContent}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-gray-600 mb-6">
            Sign up now to start your personalized relationship journey with Couple Compass.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
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
