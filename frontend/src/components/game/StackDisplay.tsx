import React from 'react';
import type { StackItem } from '../../contexts/DeckProvider';

interface StackDisplayProps {
  stack: StackItem[];
  priorityPlayerId: string;
  activePlayerId: string;
  onPass: () => void;
  onRespond?: () => void;
  canRespond?: boolean;
}

const StackDisplay: React.FC<StackDisplayProps> = ({
  stack,
  priorityPlayerId,
  activePlayerId,
  onPass,
  onRespond,
  canRespond = false
}) => {
  if (stack.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black bg-opacity-80 rounded-lg p-4 backdrop-blur-sm border border-blue-400 shadow-xl">
        <div className="text-center mb-3">
          <h3 className="text-white text-lg font-bold mb-1">The Stack</h3>
          <div className="text-blue-200 text-sm">
            Priority: {priorityPlayerId === activePlayerId ? 'Your Turn' : 'Opponent\'s Turn'}
          </div>
        </div>
        
        {/* Stack Items */}
        <div className="max-h-64 overflow-y-auto mb-3">
          {stack.map((item, index) => (
            <div 
              key={item.id} 
              className={`mb-2 p-2 rounded border ${
                index === stack.length - 1 
                  ? 'border-yellow-400 bg-yellow-900 bg-opacity-30' 
                  : 'border-gray-400 bg-gray-800 bg-opacity-30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-white text-sm font-semibold">
                    {stack.length - index}. {item.card.name}
                  </div>
                  <div className="text-gray-300 text-xs">
                    ({item.type})
                  </div>
                </div>
                <div className="text-blue-200 text-xs">
                  {item.controller === activePlayerId ? 'You' : 'Opponent'}
                </div>
              </div>
              {item.description && (
                <div className="text-gray-300 text-xs mt-1">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Priority Controls */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={onPass}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            Pass Priority
          </button>
          {canRespond && onRespond && (
            <button
              onClick={onRespond}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-semibold"
            >
              Respond
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StackDisplay; 