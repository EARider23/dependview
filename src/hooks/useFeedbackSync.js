import { useEffect, useCallback } from 'react'

  const JIRA_PROXY_URL = import.meta.env.VITE_JIRA_PROXY_URL || 'YOUR_PROXY_URL'

export const useFeedbackSync = (onTicketResolved) => {

  const checkTicketStatus = useCallback(async () => {
    // 1. Get Device ID and local tickets
    const deviceId = localStorage.getItem('peeak_device_id')
    const localStr = localStorage.getItem('peeak_user_tickets')
    
    if (!deviceId || !localStr || JIRA_PROXY_URL === 'YOUR_PROXY_URL') {
      return // Not configured or no tickets yet
    }

    try {
      const localTickets = JSON.parse(localStr)
      if (localTickets.length === 0) return

      // Only check tickets that are still "open" locally
      // Ensure we only poll valid Jira-style IDs (e.g. DEP-42), skip random UUIDs from before
      const openTicketIds = localTickets
        .filter(t => t.status !== 'resolved' && t.status !== 'closed' && /^[A-Z]+-\d+$/.test(t.id))
        .map(t => t.id)

      if (openTicketIds.length === 0) return

      // 2. Fetch latest status from Jira Proxy
      const url = new URL(`${JIRA_PROXY_URL}/api/feedback/status`)
      url.searchParams.append('ids', openTicketIds.join(','))

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to fetch ticket status from proxy')

      const remoteTickets = await response.json()
      let updatedLocal = false

      // 3. Compare and Notify
      const newLocalTickets = localTickets.map(local => {
        const remote = remoteTickets.find(r => r.id === local.id)
        if (remote && remote.status === 'resolved' && local.status !== 'resolved') {
          // 🎉 Developer resolved the bug! Notify the user!
          if (onTicketResolved) {
             onTicketResolved(local)
          }
          updatedLocal = true
          return { ...local, status: 'resolved' }
        }
        return local
      })

      // 4. Save back to local storage
      if (updatedLocal) {
        localStorage.setItem('peeak_user_tickets', JSON.stringify(newLocalTickets))
      }

    } catch (error) {
      console.error('Failed to sync feedback tickets:', error)
    }
  }, [onTicketResolved])

  // Poll every 5 minutes while the app is open
  useEffect(() => {
    // Initial check on load
    checkTicketStatus()

    const intervalId = setInterval(() => {
      checkTicketStatus()
    }, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [checkTicketStatus])
}
