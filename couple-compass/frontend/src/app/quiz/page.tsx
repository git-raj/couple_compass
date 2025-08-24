'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  HeartIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'

interface QuizOption {
  label: string
  value: string
  points: number
}

interface QuizQuestion {
  id: string
  prompt: string
  kind: string
  options: QuizOption[]
  order_index: number
  category: string
  category_weight: number
}

interface QuizCategory {
  name: string
  display_name: string
  weight: number
  description: string
  icon: string
}

interface Quiz {
  id: string
  slug: string
  title: string
  description: string
  categories: QuizCategory[]
  items: QuizQuestion[]
}

interface QuizAnswer {
  question_id: string
  answer: string
}

const categoryIcons: Record<string, string> = {
  'communication': '💬',
  'trust_security': '🔒',
  'intimacy_affection': '💕',
  'support_partnership': '🤝'
}

export default function QuizPage() {
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)

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
    fetchQuiz()
  }, [])

  const fetchQuiz = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${getApiUrl()}/quiz/relationship`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const quizData = await response.json()
        setQuiz(quizData)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (!selectedAnswer || !quiz) return

    const currentQuestion = quiz.items[currentQuestionIndex]
    const selectedOption = currentQuestion.options.find(opt => opt.value === selectedAnswer)
    
    // Show points animation
    if (selectedOption) {
      setEarnedPoints(selectedOption.points)
      setShowPointsAnimation(true)
      
      setTimeout(() => {
        setShowPointsAnimation(false)
      }, 1500)
    }

    // Save answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }))

    setTimeout(() => {
      if (currentQuestionIndex < quiz.items.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
      } else {
        submitQuiz()
      }
    }, 1000)
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      const prevQuestion = quiz!.items[currentQuestionIndex - 1]
      setSelectedAnswer(answers[prevQuestion.id] || null)
    }
  }

  const submitQuiz = async () => {
    if (!quiz) return

    setSubmitting(true)
    try {
      const token = getAuthToken()
      const submission = {
        quiz_id: quiz.id,
        answers: Object.entries(answers).map(([question_id, answer]) => ({
          question_id,
          answer
        }))
      }

      const response = await fetch(`${getApiUrl()}/quiz/relationship/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      })

      if (response.ok) {
        const result = await response.json()
        // Navigate to results page with result ID
        router.push(`/quiz/results/${result.id}`)
      } else {
        throw new Error('Failed to submit quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const startQuiz = () => {
    setShowIntro(false)
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
          <p className="text-gray-600">Loading your relationship quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quiz not available. Please try again later.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (showIntro) {
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
          </div>

          {/* Quiz Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <HeartIcon className="w-12 h-12 text-white" />
              </motion.div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{quiz.description}</p>

            {/* Categories Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {quiz.categories.map((category) => (
                <motion.div
                  key={category.name}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="text-2xl mb-2">{categoryIcons[category.name] || category.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-900">{category.display_name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{Math.round(category.weight * 100)}% weight</p>
                </motion.div>
              ))}
            </div>

            {/* Quiz Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{quiz.items.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">~5</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">🎯</div>
                  <div className="text-sm text-gray-600">Personalized</div>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={startQuiz}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                <SparklesIcon className="w-6 h-6 mr-2" />
                Start Quiz
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.items[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.items.length) * 100
  const currentCategory = quiz.categories.find(cat => cat.name === currentQuestion.category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">
              Question {currentQuestionIndex + 1} of {quiz.items.length}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{currentCategory?.display_name}</span>
              <span className="text-lg">{categoryIcons[currentQuestion.category] || '📊'}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-lg font-semibold text-purple-600">{Math.round(progress)}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
          <motion.div
            className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {currentQuestion.prompt}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-6 text-left rounded-xl border-2 transition-all ${
                    selectedAnswer === option.value
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        selectedAnswer === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg">{option.label}</span>
                    </div>
                    {selectedAnswer === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-2 text-purple-600"
                      >
                        <span className="text-sm font-medium">+{option.points} pts</span>
                        <SparklesIcon className="w-5 h-5" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next Button */}
        <div className="text-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || submitting}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                'Calculating Results...'
              ) : currentQuestionIndex === quiz.items.length - 1 ? (
                <>
                  <TrophyIcon className="w-6 h-6 mr-2" />
                  Complete Quiz
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRightIcon className="w-6 h-6 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Points Animation */}
        <AnimatePresence>
          {showPointsAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -50, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg">
                +{earnedPoints} points!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
