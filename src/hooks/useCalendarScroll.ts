
import { useRef, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export const useCalendarScroll = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Scroll to the current time on initial render
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Only scroll to current time if it's between 8am and 8pm (typical working hours)
      if (hours >= 8 && hours < 20) {
        const scrollPosition = (hours - 8) * 60 + minutes;
        scrollContainerRef.current.scrollTop = scrollPosition;
      }
    }
  }, []);

  return {
    scrollContainerRef,
    isMobile
  };
};
