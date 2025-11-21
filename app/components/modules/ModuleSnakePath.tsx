"use client"

import { motion } from "framer-motion"
import { ModuleTile } from "./ModuleTile"
import { cn } from "@/lib/utils"

interface ModuleData {
  id: string | number
  title: string
  description: string
  emoji: string
  uiState: 'completed' | 'current' | 'available' | 'locked'
  completionInfo?: {
    completionPercentage: number
  }
}

interface ModuleSnakePathProps {
  modules: ModuleData[]
  onModuleClick: (module: any, e: React.MouseEvent) => void
}

export function ModuleSnakePath({ modules, onModuleClick }: ModuleSnakePathProps) {
  // Desktop grid constant
  const ITEMS_PER_ROW = 3
  
  // Split modules into rows for snake layout
  const rows = []
  for (let i = 0; i < modules.length; i += ITEMS_PER_ROW) {
    rows.push(modules.slice(i, i + ITEMS_PER_ROW))
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 pb-20">
      {/* Mobile View: Vertical Stack */}
      <div className="md:hidden flex flex-col items-center space-y-12">
        {modules.map((module, index) => (
          <div key={module.id} className="relative flex flex-col items-center w-full z-10">
            {/* Vertical Connector - Connects center of tile to center of next tile */}
            {index < modules.length - 1 && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-[calc(100%+3rem)] bg-slate-100 -z-10 rounded-full" />
            )}
            <ModuleTile 
              {...module}
              state={module.uiState}
              progress={module.completionInfo?.completionPercentage}
              onClick={(e) => onModuleClick(module, e)}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Desktop View: Snake Layout */}
      <div className="hidden md:flex flex-col gap-y-24">
        {rows.map((rowModules, rowIndex) => {
          const isEvenRow = rowIndex % 2 === 0 // LTR (0, 2, 4)
          // Odd rows (1, 3, 5) are RTL
          
          const isLastRow = rowIndex === rows.length - 1

          return (
            <div 
              key={rowIndex} 
              className={cn(
                "flex items-start justify-center gap-32 relative",
                !isEvenRow && "flex-row-reverse"
              )}
            >
              {rowModules.map((module, colIndex) => {
                const globalIndex = rowIndex * ITEMS_PER_ROW + colIndex
                const isLastInRow = colIndex === rowModules.length - 1

                return (
                  <div key={module.id} className="relative group z-10">
                    {/* Horizontal Connector to Next Item in Row */}
                    {!isLastInRow && (
                      <div className={cn(
                        "absolute top-20 -translate-y-1/2 w-32 h-4 bg-slate-100 -z-10 rounded-full",
                        // Even Row (LTR): Connect to Right
                        // Odd Row (RTL): Connect to Left (visually next item is to the left)
                        isEvenRow ? "-right-32" : "-left-32"
                      )} />
                    )}

                    {/* Vertical Turn Connector to Next Row */}
                    {/* Connects the last item of this row to the first item of the next row */}
                    {isLastInRow && !isLastRow && (
                      <div className={cn(
                        "absolute top-20 w-[8.5rem] h-[calc(100%+6rem)] border-[16px] border-slate-100 -z-10",
                        // Even Row (LTR): Curve Right-Down-Left
                        // Odd Row (RTL): Curve Left-Down-Right
                        isEvenRow 
                          ? "right-[-4.25rem] rounded-r-[4rem] border-l-0 border-t-0 rounded-br-[4rem]"
                          : "left-[-4.25rem] rounded-l-[4rem] border-r-0 border-t-0 rounded-bl-[4rem]",
                        // Adjust height to reach next row's top-20
                        // Gap is 24 (6rem). Tile is ~12rem with text?
                        // Just making it tall enough to overlap nicely with the next row start
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
