'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  HeartIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface PartnerInfo {
  id: number
  name: string
  email: string
  linked_at: string
}

interface PartnerStatus {
  has_partner: boolean
  partner?: PartnerInfo
  active_code?: string
  active_code_expires_at?: string
}

interface CodeResponse {
  code: string
  expires_at: string
  message: string
}

export default function PartnerPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'generate' | 'enter'>('generate')
  const [loading, setLoading] = useState(true)
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Get API base URL
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

  // Format code for display (XXX-XXX)
  const formatCode = (code: string) => {
    if (code.length === 6) {
      return `${code.slice(0, 3)}-${code.slice(3)}`
    }
    return code
  }

  // Calculate time left until expiration
  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date()
    const expiration = new Date(expiresAt)
    const diff = expiration.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  // Fetch partner status
  const fetchPartnerStatus = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${getApiUrl()}/partner/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const status = await response.json()
        setPartnerStatus(status)
        
        if (status.active_code) {
          setGeneratedCode(status.active_code)
          setCodeExpiresAt(status.active_code_expires_at)
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch partner status' })
      }
    } catch (error) {
      console.error('Error fetching partner status:', error)
      setMessage({ type: 'error', text: 'Error fetching partner status' })
    } finally {
      setLoading(false)
    }
  }

  // Generate partner code
  const generateCode = async () => {
    setIsGenerating(true)
    setMessage(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${getApiUrl()}/partner/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result: CodeResponse = await response.json()
        setGeneratedCode(result.code)
        setCodeExpiresAt(result.expires_at)
        setMessage({ type: 'success', text: result.message })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to generate code' })
      }
    } catch (error) {
      console.error('Error generating code:', error)
      setMessage({ type: 'error', text: 'Error generating code' })
    } finally {
      setIsGenerating(false)
    }
  }

  // Link with partner
  const linkPartner = async () => {
    if (!enteredCode || enteredCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-character code' })
      return
    }

    setIsLinking(true)
    setMessage(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${getApiUrl()}/partner/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: enteredCode.toUpperCase() }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: result.message })
        setEnteredCode('')
        await fetchPartnerStatus() // Refresh status
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to link with partner' })
      }
    } catch (error) {
      console.error('Error linking partner:', error)
      setMessage({ type: 'error', text: 'Error linking with partner' })
    } finally {
      setIsLinking(false)
    }
  }

  // Unlink partner
  const unlinkPartner = async () => {
    if (!confirm('Are you sure you want to unlink from your partner?')) return
    
    setIsUnlinking(true)
    setMessage(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${getApiUrl()}/partner/unlink`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: result.message })
        await fetchPartnerStatus() // Refresh status
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to unlink partner' })
      }
    } catch (error) {
      console.error('Error unlinking partner:', error)
      setMessage({ type: 'error', text: 'Error unlinking partner' })
    } finally {
      setIsUnlinking(false)
    }
  }

  // Copy code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage({ type: 'success', text: 'Code copied to clipboard!' })
    } catch (error) {
      console.error('Failed to copy:', error)
      setMessage({ type: 'error', text: 'Failed to copy code' })
    }
  }

  // Format entered code as user types
  const handleCodeInput = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
    setEnteredCode(cleaned)
  }

  useEffect(() => {
    fetchPartnerStatus()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (codeExpiresAt) {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(codeExpiresAt))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [codeExpiresAt])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading partner status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Connection</h1>
                <p className="text-sm text-gray-600">Link your account with your partner</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Partner Status */}
        {partnerStatus?.has_partner ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Connected Partner</h2>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-800">{partnerStatus.partner?.name}</p>
                  <p className="text-sm text-gray-600">{partnerStatus.partner?.email}</p>
                  <p className="text-sm text-gray-500">
                    Connected on {new Date(partnerStatus.partner?.linked_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <LinkIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-600">Connected</p>
                </div>
                <Button
                  onClick={unlinkPartner}
                  disabled={isUnlinking}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {isUnlinking ? 'Unlinking...' : 'Unlink'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Generate Code
              </button>
              <button
                onClick={() => setActiveTab('enter')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'enter'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Enter Code
              </button>
            </div>

            {/* Generate Code Tab */}
            {activeTab === 'generate' && (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Partner Code</h2>
                <p className="text-gray-600 mb-6">
                  Create a unique code to share with your partner. They can use this code to link their account with yours.
                </p>

                {generatedCode ? (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2">Your Partner Code</p>
                      <div className="text-4xl font-bold text-primary-600 mb-4 tracking-wider">
                        {formatCode(generatedCode)}
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                        <ClockIcon className="w-4 h-4" />
                        <span>{timeLeft}</span>
                      </div>
                      <div className="flex justify-center space-x-3">
                        <Button
                          onClick={() => copyToClipboard(generatedCode)}
                          variant="outline"
                          size="sm"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button
                          onClick={generateCode}
                          disabled={isGenerating}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowPathIcon className="w-4 h-4 mr-2" />
                          {isGenerating ? 'Generating...' : 'New Code'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={generateCode}
                    disabled={isGenerating}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </Button>
                )}
              </div>
            )}

            {/* Enter Code Tab */}
            {activeTab === 'enter' && (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Partner Code</h2>
                <p className="text-gray-600 mb-6">
                  Enter the 6-character code shared by your partner to link your accounts.
                </p>

                <div className="max-w-sm mx-auto">
                  <div className="mb-4">
                    <input
                      type="text"
                      value={formatCode(enteredCode)}
                      onChange={(e) => handleCodeInput(e.target.value)}
                      placeholder="XXX-XXX"
                      className="w-full text-center text-2xl font-bold tracking-wider py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      maxLength={7} // Includes the dash
                    />
                  </div>
                  <Button
                    onClick={linkPartner}
                    disabled={isLinking || enteredCode.length !== 6}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isLinking ? 'Linking...' : 'Link Accounts'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How it works</h3>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <p>One partner generates a 6-character code that expires in 24 hours</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <p>Share the code with your partner via text, email, or any secure method</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <p>The other partner enters the code to instantly link both accounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
