import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { TrendingUp } from 'lucide-react'
import { Badge } from './ui/badge'
import AnimatedCounter from './AnimatedCounter'

const Top5Packages = ({ topPackages, scanResult, formatBytes }) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (topPackages.length > 0) {
      // Staggered entry for the items
      gsap.fromTo(".top-5-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );

      // Animate the background bars filling up
      gsap.fromTo(".size-bar",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, delay: 0.4, ease: "power3.out", transformOrigin: "left" }
      );
    }
  }, { scope: containerRef, dependencies: [topPackages], revertOnUpdate: true });

  return (
    <div ref={containerRef} className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group mb-10">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <TrendingUp size={100} />
      </div>

      <div className="flex items-center justify-between mb-8 px-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Storage Analytics</span>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-black px-3 py-1 rounded-xl shadow-sm">
          Precision Metrics
        </Badge>
      </div>

      <div className="space-y-4 relative z-10">
        {topPackages.map((pkg, i) => {
          const maxVal = topPackages[0]?.size || 1;
          const percentage = (pkg.size / maxVal) * 100;

          return (
            <div key={i} className="top-5-item opacity-0 relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl p-5 border border-white/60 hover:border-purple-300 transition-all hover:bg-white/80 hover:shadow-2xl group/item">
              {/* Animated Background Bar - Glassmorphic style */}
              <div
                className="size-bar absolute left-0 top-0 bottom-0 bg-purple-500/[0.03] group-hover/item:bg-purple-500/[0.07] transition-all duration-700 rounded-r-2xl"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center font-black text-xs text-gray-500 shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-gray-900 block truncate pr-4">{pkg.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Rank {i + 1}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-purple-600 block">
                    <AnimatedCounter value={pkg.size} formatter={formatBytes} delay={0.4 + (i * 0.1)} />
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {((pkg.size / (scanResult?.total_size || 1)) * 100).toFixed(1)}% of total
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {topPackages.length === 0 && (
          <div className="space-y-3 opacity-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-2xl h-16 w-full animate-pulse border border-gray-100" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Top5Packages
