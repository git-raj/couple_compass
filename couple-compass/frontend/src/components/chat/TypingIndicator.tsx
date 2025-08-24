'use client'

interface TypingIndicatorProps {
  partnerName: string
  isVisible: boolean
}

export default function TypingIndicator({ partnerName, isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-gray-500">{partnerName} is typing...</span>
        </div>
      </div>
    </div>
  )
}
