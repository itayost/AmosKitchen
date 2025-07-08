'use client';

// components/shared/animated-number.tsx
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 1000 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const steps = 60;
    const stepDuration = duration / steps;
    const stepValue = (endValue - startValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep === steps) {
        setDisplayValue(endValue);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {prefix}{Math.round(displayValue).toLocaleString('he-IL')}{suffix}
    </span>
  );
}
