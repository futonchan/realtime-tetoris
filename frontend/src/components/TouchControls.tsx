import React, { useRef, useCallback } from 'react';
import './TouchControls.css';

interface TouchControlsProps {
  onMove: (x: number, y: number) => void;
  onRotate: () => void;
  onHardDrop: () => void;
  disabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onRotate,
  onHardDrop,
  disabled = false
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((action: () => void, repeat = false) => {
    if (disabled) return;
    
    // Execute immediately
    action();
    
    // Set up repeat if needed
    if (repeat) {
      repeatIntervalRef.current = window.setInterval(action, 150);
    }
    
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  const handleButtonTouchStart = useCallback((action: () => void) => {
    if (disabled) return;
    
    action();
    
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [disabled]);

  return (
    <div className="touch-controls">
      <div className="touch-controls-left">
        <div className="dpad">
          <button
            className="dpad-button dpad-up"
            onTouchStart={() => handleTouchStart(() => onRotate())}
            onTouchEnd={handleTouchEnd}
            disabled={disabled}
          >
            ↑
          </button>
          <div className="dpad-middle">
            <button
              className="dpad-button dpad-left"
              onTouchStart={() => handleTouchStart(() => onMove(-1, 0), true)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
            >
              ←
            </button>
            <button
              className="dpad-button dpad-right"
              onTouchStart={() => handleTouchStart(() => onMove(1, 0), true)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
            >
              →
            </button>
          </div>
          <button
            className="dpad-button dpad-down"
            onTouchStart={() => handleTouchStart(() => onMove(0, 1), true)}
            onTouchEnd={handleTouchEnd}
            disabled={disabled}
          >
            ↓
          </button>
        </div>
      </div>
      
      <div className="touch-controls-right">
        <button
          className="action-button rotate-button"
          onTouchStart={() => handleButtonTouchStart(() => onRotate())}
          disabled={disabled}
        >
          回転
        </button>
        <button
          className="action-button drop-button"
          onTouchStart={() => handleButtonTouchStart(() => onHardDrop())}
          disabled={disabled}
        >
          落下
        </button>
      </div>
    </div>
  );
};