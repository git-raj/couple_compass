'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  UserCircleIcon, 
  CogIcon, 
  UsersIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import ProfileSettingsModal from './ProfileSettingsModal'
import PartnerConnectionModal from './PartnerConnectionModal'

interface ProfileDropdownProps {
  user: {
    id: number
    name: string
    email: string
  }
  onLogout: () => void
}

export default function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown when pressing Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleProfileSettings = () => {
    setIsOpen(false)
    setShowProfileModal(true)
  }

  const handlePartnerConnection = () => {
    setIsOpen(false)
    setShowPartnerModal(true)
  }

  const handleLogout = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <UserCircleIcon className="w-5 h-5" />
          <span>{user.name || 'User'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {/* Profile Settings */}
              <button
                onClick={handleProfileSettings}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CogIcon className="w-5 h-5 mr-3 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium">Profile Settings</div>
                  <div className="text-xs text-gray-500">Update your personal information</div>
                </div>
              </button>

              {/* Partner Connection */}
              <button
                onClick={handlePartnerConnection}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="w-5 h-5 mr-3 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium">Partner Connection</div>
                  <div className="text-xs text-gray-500">Manage your partner link</div>
                </div>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-100 my-1"></div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                <div className="font-medium">Sign Out</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileSettingsModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}

      {showPartnerModal && (
        <PartnerConnectionModal
          isOpen={showPartnerModal}
          onClose={() => setShowPartnerModal(false)}
        />
      )}
    </>
  )
}
