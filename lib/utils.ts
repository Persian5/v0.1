import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fisher-Yates shuffle algorithm
 * Properly randomizes array elements with uniform distribution
 * 
 * @param array - Array to shuffle
 * @returns New shuffled array (does not mutate original)
 * 
 * @example
 * const cards = [1, 2, 3, 4];
 * const shuffled = shuffle(cards);
 * // cards remains [1, 2, 3, 4]
 * // shuffled is randomly ordered
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
