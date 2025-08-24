'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  HeartIcon, 
  ArrowLeftIcon, 
  ShareIcon,
  TrophyIcon,
  SparklesIcon,
  ChartBarIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface CategoryScore {
  category: string
  display_name: string
  score: number
  percentage: number
  max_possible: number
  interpretation: string
  icon: string
}

interface QuizInsight {
  category: string
  insight_type: string
  message: string
  recommendation?: string
}

interface QuizResult {
  id: string
  quiz_id: string
  user_id: string
  overall_score: number
  interpretation: string
  interpretation_details: {
    level: string
    title: string
    description: string
    color: string
  }
  category_scores: CategoryScore[]
  insights: QuizInsight[]
  comprehensive_insights?: string
  relationship_tips?: Array<{title: string, description: string}>
  responses: Record<string, any>
  created_at: string
  updated_at: string
}

const categoryIcons: Record<string, string> = {
  'communication': '💬',
  'trust_security': '🔒', 
  'intimacy_affection': '💕',
  'support_partnership': '🤝'
}

const insightIcons: Record<string, string> = {
  'strength': '🌟',
  'improvement': '🎯',
  'tip': '💡'
}

export default function QuizResultsPage() {
  const router = useRouter()
  const params = useParams()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)

  // Get API URL
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  useEffect(() => {
    if (params?.id) {
      fetchResult(params.id as string)
    }
  }, [params?.id])

  useEffect(() => {
    if (result && result.overall_score >= 85) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [result])

  const fetchResult = async (resultId: string) => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${getApiUrl()}/quiz/relationship/results/${resultId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const resultData = await response.json()
        setResult(resultData)
      } else if (response.status === 401) {
        router.push('/login')
      } else {
        throw new Error('Failed to fetch results')
      }
    } catch (error) {
      console.error('Error fetching result:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeQuiz = () => {
    router.push('/quiz')
  }

  const handleShareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Relationship Quiz Results',
        text: `I scored ${result?.overall_score.toFixed(1)}% on my relationship evaluation!`,
        url: window.location.href
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Results link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Results not found.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>

          <Button
            onClick={handleShareResults}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <ShareIcon className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500 to-purple-500"></div>
            </div>

            <div className="relative z-10">
              {/* Achievement Badge */}
              {result.overall_score >= 85 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute top-4 right-4"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                    <TrophyIcon className="w-4 h-4" />
                    <span>Excellent!</span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-32 h-32 mx-auto mb-6 relative"
              >
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <motion.path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={result.interpretation_details.color}
                    strokeWidth="3"
                    strokeDasharray={`${result.overall_score}, 100`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${result.overall_score}, 100` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: result.interpretation_details.color }}>
                      {result.overall_score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {result.interpretation_details.title}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  {result.interpretation_details.description}
                </p>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4" />
                    <span>Overall Score</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>{result.category_scores.length} Categories</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Category Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Category Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.category_scores.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{categoryIcons[category.category] || category.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.display_name}</h3>
                      <p className="text-sm text-gray-600">{category.interpretation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{category.percentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">{category.score}/{category.max_possible}</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Insights */}
        {result.insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Personalized Insights</h2>
            <div className="space-y-4">
              {result.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 ${
                    insight.insight_type === 'strength' ? 'border-green-500' :
                    insight.insight_type === 'improvement' ? 'border-orange-500' :
                    'border-blue-500'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {insightIcons[insight.insight_type] || '💡'}
                    </div>
                    <div className="flex-1">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                        insight.insight_type === 'strength' ? 'bg-green-100 text-green-800' :
                        insight.insight_type === 'improvement' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)}
                      </div>
                      <p className="text-gray-700 mb-2">{insight.message}</p>
                      {insight.recommendation && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">Recommendation:</span> {insight.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comprehensive Insights */}
        {result.comprehensive_insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Relationship Analysis</h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">🔍</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Relationship Insights</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {result.comprehensive_insights}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Relationship Tips */}
        {result.relationship_tips && result.relationship_tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Actionable Tips for Your Relationship</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.relationship_tips.slice(0, 3).map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{tip.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{tip.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRetakeQuiz}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl shadow-lg"
              >
                <SparklesIcon className="w-6 h-6 mr-2" />
                Retake Quiz
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push('/mood-tracker')}
                variant="outline"
                size="lg"
                className="px-8 py-4 rounded-xl border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <HeartIcon className="w-6 h-6 mr-2" />
                Track Daily Mood
              </Button>
            </motion.div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Track your progress by retaking the quiz periodically to see improvement over time.
          </p>
        </motion.div>

        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    y: -10,
                    x: Math.random() * window.innerWidth,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{
                    opacity: 0,
                    y: window.innerHeight + 10,
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    ease: "easeOut"
                  }}
                  className={`absolute w-3 h-3 ${
                    ['bg-pink-500', 'bg-purple-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500'][i % 5]
                  } rounded-full`}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
