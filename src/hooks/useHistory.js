import { useState, useEffect, useCallback } from 'react'

export const useHistory = () => {
  const [historyRecords, setHistoryRecords] = useState([])

  const loadHistory = useCallback(() => {
    const saved = localStorage.getItem('history')
    if (saved) {
      try {
        setHistoryRecords(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }, [])

  const addHistoryRecord = useCallback((record) => {
    const newRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...record
    }
    setHistoryRecords(prev => {
      const updated = [newRecord, ...prev].slice(0, 50) // Keep last 50
      localStorage.setItem('history', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistoryRecords([])
      localStorage.removeItem('history')
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    historyRecords,
    addHistoryRecord,
    clearHistory
  }
}
