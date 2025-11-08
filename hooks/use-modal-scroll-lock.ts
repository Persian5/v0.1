import { useEffect } from 'react'

/**
 * Hook to freeze/unfreeze body scroll when modal is open
 * 
 * Prevents background scrolling when modal is displayed.
 * Automatically restores scroll when modal closes or component unmounts.
 * 
 * @param isOpen - Whether the modal is currently open
 */
export function useModalScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
}

