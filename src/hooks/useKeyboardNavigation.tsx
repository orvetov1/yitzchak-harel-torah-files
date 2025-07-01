
import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleFullscreen: () => void;
  isEnabled: boolean;
}

export const useKeyboardNavigation = ({
  onPrevPage,
  onNextPage,
  onToggleFullscreen,
  isEnabled
}: UseKeyboardNavigationProps) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default if we're handling the key
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onPrevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNextPage();
          break;
        case 'f':
        case 'F':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onToggleFullscreen();
          }
          break;
        case 'Escape':
          event.preventDefault();
          // Exit fullscreen if in fullscreen mode
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onPrevPage, onNextPage, onToggleFullscreen, isEnabled]);
};
