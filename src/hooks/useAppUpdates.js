import { useState, useEffect } from 'react'

export const APP_CONFIG = {
  version: '1.0.0',
  hasNewPatchNotes: false, // Change this to true when you have updates to show!
}

export const useAppUpdates = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showLaunchModal, setShowLaunchModal] = useState(false)

  useEffect(() => {
    // Check local storage to see what version the user last saw
    const lastSeenVersion = localStorage.getItem('peeak_last_seen_version')

    if (!lastSeenVersion) {
      // Brand new user! Show them the magical onboarding.
      setShowOnboarding(true)
    } else if (lastSeenVersion !== APP_CONFIG.version && APP_CONFIG.hasNewPatchNotes) {
      // Returning user, but they haven't seen the new major update yet
      setShowLaunchModal(true)
    }
  }, [])

  const finishOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('peeak_last_seen_version', APP_CONFIG.version)
  }

  const finishLaunchModal = () => {
    setShowLaunchModal(false)
    localStorage.setItem('peeak_last_seen_version', APP_CONFIG.version)
  }

  // Helper function to force onboarding for testing
  const triggerOnboardingTest = () => {
    localStorage.removeItem('peeak_last_seen_version')
    setShowOnboarding(true)
  }

  // Helper function to force Launch Modal for testing
  const triggerLaunchModalTest = () => {
    localStorage.setItem('peeak_last_seen_version', '0.9.0') // simulate older version
    setShowLaunchModal(true)
  }

  return {
    showOnboarding,
    showLaunchModal,
    finishOnboarding,
    finishLaunchModal,
    triggerOnboardingTest,
    triggerLaunchModalTest
  }
}
