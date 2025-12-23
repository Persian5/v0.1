"use client"

import { ModuleTile } from "./ModuleTile"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ModuleData {
  id: string | number
  title: string
  description: string
  emoji?: string
  uiState: 'completed' | 'current' | 'available' | 'locked'
  completionInfo?: {
    completionPercentage: number
  }
  lessonCount?: number
  prerequisiteMessage?: string
}

interface ModuleSnakePathProps {
  modules: ModuleData[]
  onModuleClick: (module: any, e: React.MouseEvent) => void
}

// Hook to detect items per row based on screen width
function useItemsPerRow() {
  const [itemsPerRow, setItemsPerRow] = useState(4) // Default to desktop

  useEffect(() => {
    function handleResize() {
      // Breakpoints
      if (window.innerWidth >= 1280) { // xl
        setItemsPerRow(4)
      } else if (window.innerWidth >= 1024) { // lg
        setItemsPerRow(3)
      } else if (window.innerWidth >= 768) { // md
        setItemsPerRow(2)
      } else {
        setItemsPerRow(1) // Mobile
      }
    }

    // Initial check
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return itemsPerRow
}

export function ModuleSnakePath({ modules, onModuleClick }: ModuleSnakePathProps) {
  const itemsPerRow = useItemsPerRow()
  const isMobile = itemsPerRow === 1
  
  // Split modules into rows for snake layout
  // We pad the last row with nulls to ensure alignment if needed? 
  // No, we just map the available modules. 
  // However, for standard Snake logic, if a row is shorter, the connector might look weird if we justify-center.
  // We will just map what we have.
  const rows = []
  if (!isMobile) {
    for (let i = 0; i < modules.length; i += itemsPerRow) {
      rows.push(modules.slice(i, i + itemsPerRow))
    }
  }

  return (
    <div className="relative w-full max-w-[90rem] mx-auto px-4 pb-20">
      {/* Mobile View: Timeline Layout */}
      <div className={cn("md:hidden relative pt-8 pb-20 pl-2", !isMobile && "hidden")}>
        {/* Continuous Vertical Line (Left Side) */}
        <div className="absolute left-[3.75rem] top-0 bottom-0 w-3 bg-slate-200 rounded-full -z-10" />

        <div className="flex flex-col space-y-10">
          {modules.map((module, index) => (
            <div key={module.id} className="flex items-start gap-5 relative">
               {/* Tile on the timeline (Left) */}
               <div className="shrink-0 relative z-10">
                 {/* We hide the default text in ModuleTile via CSS (hidden on mobile) and show it to the right */}
                 <div className="[&_div.text-center]:hidden"> 
                   <ModuleTile 
                     {...module}
                     state={module.uiState}
                     progress={module.completionInfo?.completionPercentage}
                     onClick={(e) => onModuleClick(module, e)}
                     index={index}
                   />
                 </div>
               </div>
               
               {/* Text Content (Right Side) - WIDER/HORIZONTAL */}
               <div className={cn(
                 "pt-3 transition-opacity duration-300 flex-1 min-w-[200px] pr-2",
                 module.uiState === 'locked' ? "opacity-50 grayscale" : "opacity-100"
               )}>
                 <h3 className="font-bold text-neutral-800 text-xl leading-tight mb-2">
                   {module.title}
                 </h3>
                 <p className="text-sm font-medium text-neutral-500 leading-relaxed w-full text-balance">
                   {module.description}
                 </p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View: Responsive Snake Layout */}
      <div className={cn("hidden md:flex flex-col gap-y-20 transition-all duration-300", isMobile && "hidden")}>
        {rows.map((rowModules, rowIndex) => {
          const isEvenRow = rowIndex % 2 === 0 // LTR (0, 2, 4)
          const isLastRow = rowIndex === rows.length - 1
          
          // Determine connector width based on items per row/screen size approximation
          // We use a fixed logic: if itemsPerRow changes, the justify-center handles spacing, 
          // but we need the connector to bridge the gap. 
          // Let's use a consistent gap and connector width.
          // gap-16 lg:gap-24 xl:gap-32
          
          return (
            <div 
              key={rowIndex} 
              className={cn(
                "flex items-start justify-center gap-16 lg:gap-24 xl:gap-32 relative",
                !isEvenRow && "flex-row-reverse"
              )}
            >
              {rowModules.map((module, colIndex) => {
                const globalIndex = rowIndex * itemsPerRow + colIndex
                const isLastInRow = colIndex === rowModules.length - 1

                return (
                  <div key={module.id} className="relative group z-10">
                    {/* Horizontal Connector to Next Item in Row */}
                    {!isLastInRow && (
                      <div className={cn(
                        "absolute top-[4.5rem] -translate-y-1/2 w-16 lg:w-24 xl:w-32 h-4 bg-slate-200 -z-10 rounded-full",
                        // Even Row (LTR): Connect to Right
                        // Odd Row (RTL): Connect to Left (visually next item is to the left)
                        isEvenRow ? "-right-16 lg:-right-24 xl:-right-32" : "-left-16 lg:-left-24 xl:-left-32"
                      )} />
                    )}

                    {/* Vertical Turn Connector to Next Row */}
                    {/* Connects the last item of this row to the first item of the next row */}
                    {isLastInRow && !isLastRow && (
                      <div className={cn(
                        "absolute top-[4.5rem] w-[6.5rem] lg:w-[8.5rem] xl:w-[10.5rem] h-[calc(100%+5rem)] border-[16px] border-slate-200 -z-10",
                        // Even Row (LTR): Curve Right-Down-Left
                        // Odd Row (RTL): Curve Left-Down-Right
                        isEvenRow 
                          ? "right-[-3.25rem] lg:right-[-4.25rem] xl:right-[-5.25rem] rounded-r-[4.5rem] border-l-0 border-t-0 rounded-br-[4.5rem]"
                          : "left-[-3.25rem] lg:left-[-4.25rem] xl:left-[-5.25rem] rounded-l-[4.5rem] border-r-0 border-t-0 rounded-bl-[4.5rem]",
                      )} />
                    )}

                    <ModuleTile 
                      {...module}
                      state={module.uiState}
                      progress={module.completionInfo?.completionPercentage}
                      onClick={(e) => onModuleClick(module, e)}
                      index={globalIndex}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
