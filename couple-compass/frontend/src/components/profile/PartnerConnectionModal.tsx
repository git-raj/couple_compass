'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  UsersIcon,
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PartnerConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PartnerStatus {
  has_partner: boolean
  partner?: {
    id: number
    name: string
    email: string
    linked_at: string
  }
  active_code?: string
  active_code_expires_at?: string
}

export default function PartnerConnectionModal({ isOpen, onClose }: PartnerConnectionModalProps) {
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [partnerCode, setPartnerCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  // API helper
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  // Load partner status
  useEffect(() => {
    if (isOpen) {
      loadPartnerStatus()
    }
  }, [isOpen])

  const loadPartnerStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/partner/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPartnerStatus(data)
      } else {
        setError('Failed to load partner status')
      }
    } catch (err) {
      setError('Failed to load partner status')
      console.error('Partner status error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/partner/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPartnerStatus(prev => prev ? {
          ...prev,
          active_code: data.code,
          active_code_expires_at: data.expires_at
        } : null)
        setSuccess('Connection code generated successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to generate code')
      }
    } catch (err) {
      setError('Failed to generate code')
      console.error('Code generation error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const connectWithPartner = async () => {
    if (!partnerCode.trim()) {
      setError('Please enter a partner code')
      return
    }

    setConnecting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/partner/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: partnerCode.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`Successfully connected with ${data.partner.name}!`)
        setPartnerCode('')
        // Refresh partner status
        await loadPartnerStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to connect with partner')
      }
    } catch (err) {
      setError('Failed to connect with partner')
      console.error('Partner connection error:', err)
    } finally {
      setConnecting(false)
    }
  }

  const disconnectPartner = async () => {
    setDisconnecting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/partner/unlink`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setSuccess('Successfully disconnected from partner')
        setShowDisconnectConfirm(false)
        // Refresh partner status
        await loadPartnerStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to disconnect partner')
      }
    } catch (err) {
      setError('Failed to disconnect partner')
      console.error('Partner disconnection error:', err)
    } finally {
      setDisconnecting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isCodeExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UsersIcon className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Partner Connection</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading partner status...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              {partnerStatus?.has_partner ? (
                /* Connected State */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Connected with Partner
                    </h3>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><strong>Partner:</strong> {partnerStatus.partner?.name}</div>
                    <div><strong>Email:</strong> {partnerStatus.partner?.email}</div>
                    <div><strong>Connected:</strong> {partnerStatus.partner?.linked_at ? formatDate(partnerStatus.partner.linked_at) : 'Unknown'}</div>
                  </div>

                  {!showDisconnectConfirm ? (
                    <Button
                      onClick={() => setShowDisconnectConfirm(true)}
                      variant="outline"
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Disconnect Partner
                    </Button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-900">Confirm Disconnection</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Are you sure you want to disconnect from your partner? This action cannot be undone.
                          </p>
                          <div className="flex space-x-3 mt-4">
                            <Button
                              onClick={disconnectPartner}
                              disabled={disconnecting}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              size="sm"
                            >
                              {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                            </Button>
                            <Button
                              onClick={() => setShowDisconnectConfirm(false)}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Connected State */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UsersIcon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Connect with Your Partner
                    </h3>
                    <p className="text-gray-600">
                      Link your accounts to share relationship insights and track progress together.
                    </p>
                  </div>

                  {/* Generate Code Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Share Your Code</h4>
                    {partnerStatus?.active_code && !isCodeExpired(partnerStatus.active_code_expires_at!) ? (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-2xl font-bold text-primary-900 mb-1">
                              {partnerStatus.active_code}
                            </div>
                            <div className="text-sm text-primary-700">
                              Expires: {formatDate(partnerStatus.active_code_expires_at!)}
                            </div>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(partnerStatus.active_code!)}
                            variant="outline"
                            size="sm"
                            className="ml-3"
                          >
                            {copied ? (
                              <>
                                <CheckIcon className="w-4 h-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={generateCode}
                        disabled={generating}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                      >
                        {generating ? 'Generating...' : 'Generate Connection Code'}
                      </Button>
                    )}
                    <p className="text-sm text-gray-500">
                      Share this code with your partner so they can connect with you. The code expires in 24 hours.
                    </p>
                  </div>

                  {/* Connect with Code Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Connect with Partner's Code</h4>
                    <div className="flex space-x-3">
                      <Input
                        type="text"
                        placeholder="Enter partner's code"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        maxLength={6}
                      />
                      <Button
                        onClick={connectWithPartner}
                        disabled={connecting || !partnerCode.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {connecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Enter the 6-character code your partner shared with you.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
