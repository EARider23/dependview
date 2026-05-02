import React from 'react'
import { motion } from 'framer-motion'
import { History, Trash2, Package, Terminal, ShieldAlert, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useHistory } from '../hooks/useHistory'

const HistoryView = () => {
  const { historyRecords, clearHistory } = useHistory()

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">Audit <span className="text-purple-600">History</span></h2>
          <p className="text-gray-500 font-medium text-lg italic">Trace your system changes and dependency updates</p>
        </div>
        <Button
          variant="ghost"
          onClick={clearHistory}
          disabled={historyRecords.length === 0}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Clear Logs
        </Button>
      </div>

      {historyRecords.length === 0 ? (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 border border-purple-50 relative z-10">
            <History className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 relative z-10">No History Records Found</h3>
          <p className="text-gray-400 max-w-sm mx-auto font-medium relative z-10">Your package installations, updates, and maintenance scans will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyRecords.map((record) => (
            <div 
              key={record.id} 
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white flex items-center justify-between group hover:bg-white transition-all shadow-sm"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                  record.type === 'install' ? 'bg-blue-50 text-blue-600' :
                  record.type === 'update' ? 'bg-green-50 text-green-600' :
                  record.type === 'maintenance' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {record.type === 'install' && <Package className="w-7 h-7" />}
                  {record.type === 'update' && <RefreshCw className="w-7 h-7" />}
                  {record.type === 'maintenance' && <Terminal className="w-7 h-7" />}
                  {record.type === 'security' && <ShieldAlert className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      record.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900">{record.title}</h4>
                  <p className="text-gray-500 font-medium text-sm">{record.description}</p>
                </div>
              </div>
              <div className="px-6 text-right hidden md:block">
                <span className="text-xs font-bold text-gray-300 italic">{record.projectName || 'System'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pb-20"></div>
    </motion.div>
  )
}

export default HistoryView
