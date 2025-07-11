import React from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

interface DrawingAnimationProps {
  card: Card | null;
  isDrawing: boolean;
}

const DrawingAnimation: React.FC<DrawingAnimationProps> = ({ card, isDrawing }) => {
  if (!isDrawing || !card) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Animated card being drawn */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="animate-drawCard"
          style={{
            '--tw-animate-drawCard': 'drawCard 0.8s ease-out forwards'
          } as React.CSSProperties}
        >
          <MtgCard
            card={card}
            showName={true}
            showManaCost={true}
            showTimestamp={false}
            context="hand"
            actions={{}}
            showOverlay={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DrawingAnimation; 