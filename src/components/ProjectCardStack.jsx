import React, { useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ProjectCard } from './ProjectCard'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from './ui/button'

gsap.registerPlugin(useGSAP)

export function ProjectCardStack({ projects, onClick, onRemove }) {
    const containerRef = useRef()
    const [order, setOrder] = useState([])

    // Initialize order array when projects change
    useEffect(() => {
        if (projects) {
            setOrder(projects.map((_, i) => i))
        }
    }, [projects])

    // Main animation effect when order changes
    useEffect(() => {
        if (!order.length) return

        const cards = gsap.utils.toArray('.project-stack-card')
        
        cards.forEach((card, domIndex) => {
            const stackPosition = order.indexOf(domIndex) // 0 is front, 1 is second, etc.
            
            // Diagonal stack logic mimicking the image
            const maxVisible = 5
            const isVisible = stackPosition < maxVisible
            const offsetAmount = 24 // pixels - increased for better visibility
            
            const xOffset = isVisible ? (stackPosition * offsetAmount) : 0
            const yOffset = isVisible ? -(stackPosition * offsetAmount) : 0
            
            const scale = 1
            
            // All visible cards should be solid to avoid backdrop-blur overlapping issues
            const opacity = isVisible ? 1 : 0
            
            // Explicitly set zIndex to avoid tweening it smoothly, but tween the rest
            gsap.set(card, { zIndex: projects.length - stackPosition })

            gsap.to(card, {
                x: xOffset,
                y: yOffset,
                scale: scale,
                rotationZ: stackPosition * 0.5, // Subtle rotation for depth
                opacity: opacity,
                duration: 0.6,
                ease: "power3.out",
                visibility: isVisible ? 'visible' : 'hidden',
                overwrite: "auto"
            })
        })
    }, [order, projects.length])

    const cycleNext = () => {
        setOrder(prev => {
            const newOrder = [...prev]
            const topCard = newOrder.shift()
            newOrder.push(topCard)
            return newOrder
        })
    }

    const cyclePrev = () => {
        setOrder(prev => {
            const newOrder = [...prev]
            const bottomCard = newOrder.pop()
            newOrder.unshift(bottomCard)
            return newOrder
        })
    }

    if (!projects || projects.length === 0) return null

    return (
        <div className="relative w-full h-[520px] flex items-center justify-center pt-8 overflow-visible" ref={containerRef}>
            
            {/* Cards Container - Adjusted Portrait Aspect Ratio */}
            <div className="relative w-[300px] h-[400px] perspective-2000">
                {projects.map((project, i) => {
                    const isTop = order[0] === i
                    return (
                        <div 
                            key={project.path || i}
                            id={`project-card-${i}`}
                            className="project-stack-card absolute inset-0 w-full transform-gpu origin-bottom cursor-pointer"
                            onClick={(e) => {
                                if (isTop) {
                                    // Swipe animation
                                    const node = document.getElementById(`project-card-${i}`)
                                    gsap.to(node, {
                                        y: 600,
                                        rotationZ: -10,
                                        duration: 0.4,
                                        ease: "power2.in",
                                        onComplete: () => {
                                            // Reset rotation for when it comes back
                                            gsap.set(node, { rotationZ: 0 })
                                            cycleNext()
                                        }
                                    })
                                } else {
                                    // Calculate how many shifts needed
                                    const shifts = order.indexOf(i)
                                    setOrder(prev => {
                                        const newOrder = [...prev]
                                        for(let s=0; s<shifts; s++){
                                            newOrder.push(newOrder.shift())
                                        }
                                        return newOrder
                                    })
                                }
                            }}
                        >
                            <div className="w-full h-full">
                                <ProjectCard 
                                    project={project} 
                                    viewMode="stack"
                                    isTop={isTop}
                                    onClick={() => onClick(project)} 
                                    onRemove={onRemove} 
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Controls */}
            {projects.length > 1 && (
                <div className="absolute -bottom-12 flex items-center gap-4">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={cyclePrev}
                        className="rounded-full shadow-lg bg-white/80 hover:bg-white text-purple-600 border border-purple-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/60 px-4 py-1.5 rounded-full">
                        {order[0] + 1} / {projects.length}
                    </div>
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={cycleNext}
                        className="rounded-full shadow-lg bg-white/80 hover:bg-white text-purple-600 border border-purple-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    )
}
