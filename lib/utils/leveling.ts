/**
 * Progressive Leveling System
 * Visual-only progression curve for dashboard display
 * No unlocks, rewards, or badges - just XP thresholds
 */

/**
 * XP required to reach each level
 * Progressive curve: starts at 60 XP for Level 1, increases by ~40-50% each level
 */
export const LEVEL_XP_THRESHOLDS = [
  0,      // Level 1: 0 XP (starting point)
  60,     // Level 2: 60 XP total
  120,    // Level 3: 120 XP total (+60)
  200,    // Level 4: 200 XP total (+80)
  300,    // Level 5: 300 XP total (+100)
  450,    // Level 6: 450 XP total (+150)
  650,    // Level 7: 650 XP total (+200)
  900,    // Level 8: 900 XP total (+250)
  1250,   // Level 9: 1250 XP total (+350)
  1650,   // Level 10: 1650 XP total (+400)
  2200,   // Level 11: 2200 XP total (+550)
  2850,   // Level 12: 2850 XP total (+650)
  3650,   // Level 13: 3650 XP total (+800)
  4600,   // Level 14: 4600 XP total (+950)
  5800,   // Level 15: 5800 XP total (+1200)
  7250,   // Level 16: 7250 XP total (+1450)
  9000,   // Level 17: 9000 XP total (+1750)
  11200,  // Level 18: 11200 XP total (+2200)
  13850,  // Level 19: 13850 XP total (+2650)
  17100,  // Level 20: 17100 XP total (+3250)
  21000,  // Level 21: 21000 XP total (+3900)
  25600,  // Level 22: 25600 XP total (+4600)
  31000,  // Level 23: 31000 XP total (+5400)
  37300,  // Level 24: 37300 XP total (+6300)
  44600,  // Level 25: 44600 XP total (+7300)
  53000,  // Level 26: 53000 XP total (+8400)
  62700,  // Level 27: 62700 XP total (+9700)
  73800,  // Level 28: 73800 XP total (+11100)
  86500,  // Level 29: 86500 XP total (+12700)
  100000, // Level 30: 100000 XP total (+13500)
]

/**
 * Get the current level from total XP
 * @param totalXp - User's total accumulated XP
 * @returns Current level (1-30+)
 */
export function getLevelFromXP(totalXp: number): number {
  if (totalXp < 0) return 1

  // Find highest level threshold that user has reached
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_XP_THRESHOLDS[i]) {
      return i + 1 // Level is index + 1 (Level 1 = index 0)
    }
  }

  return 1 // Fallback to Level 1
}

/**
 * Get total XP required to reach a specific level
 * @param level - Target level
 * @returns Total XP needed to reach that level
 */
export function getXPForLevel(level: number): number {
  const index = level - 1
  if (index < 0) return 0
  if (index >= LEVEL_XP_THRESHOLDS.length) {
    // For levels beyond our table, extrapolate with +15% per level
    const lastThreshold = LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]
    const levelsAboveMax = index - (LEVEL_XP_THRESHOLDS.length - 1)
    return Math.floor(lastThreshold * Math.pow(1.15, levelsAboveMax))
  }
  return LEVEL_XP_THRESHOLDS[index]
}

/**
 * Get XP progress within the current level
 * @param totalXp - User's total accumulated XP
 * @returns XP earned within current level (0 to XP needed for next level)
 */
export function getXPIntoCurrentLevel(totalXp: number): number {
  const currentLevel = getLevelFromXP(totalXp)
  const currentLevelStartXp = getXPForLevel(currentLevel)
  return totalXp - currentLevelStartXp
}

/**
 * Get XP required to reach the next level
 * @param currentLevel - User's current level
 * @returns XP needed to go from current level to next level
 */
export function getXPToNextLevel(currentLevel: number): number {
  const currentLevelXp = getXPForLevel(currentLevel)
  const nextLevelXp = getXPForLevel(currentLevel + 1)
  return nextLevelXp - currentLevelXp
}

/**
 * Get level progress as a percentage
 * @param totalXp - User's total accumulated XP
 * @returns Progress percentage (0-100)
 */
export function getProgressPercentage(totalXp: number): number {
  const currentLevel = getLevelFromXP(totalXp)
  const xpIntoLevel = getXPIntoCurrentLevel(totalXp)
  const xpNeeded = getXPToNextLevel(currentLevel)
  
  if (xpNeeded === 0) return 100 // Max level reached
  
  const percentage = (xpIntoLevel / xpNeeded) * 100
  return Math.min(100, Math.max(0, percentage))
}

/**
 * Get comprehensive level information
 * @param totalXp - User's total accumulated XP
 * @returns Complete level state for UI display
 */
export function getLevelInfo(totalXp: number) {
  const level = getLevelFromXP(totalXp)
  const xpIntoLevel = getXPIntoCurrentLevel(totalXp)
  const xpToNextLevel = getXPToNextLevel(level)
  const progressPercent = getProgressPercentage(totalXp)
  
  return {
    level,
    totalXp,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent,
    nextLevel: level + 1
  }
}

