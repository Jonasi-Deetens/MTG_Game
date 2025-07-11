import React, { useState } from 'react';
import type { Card as CardType } from '../types/deck';
import { useDeck } from '../contexts/DeckProvider';

interface MtgCardProps {
  card: CardType;
  className?: string;
  showName?: boolean;
  showManaCost?: boolean;
  showTimestamp?: boolean;
  timestamp?: Date;
  isCommander?: boolean;
  // Land play restriction props
  canPlayLand?: boolean;
  isLand?: boolean;
  // Land tap/untap props
  isTapped?: boolean;
  canUntap?: boolean;
  // Combat props
  isAttacking?: boolean;
  canAttack?: boolean;
  canBlock?: boolean;
  // Damage tracking
  damage?: number;
  // Overlay control
  showOverlay?: boolean;
  // Action functions for different card interactions
  actions?: {
    play?: () => void;
    discard?: () => void;
    exile?: () => void;
    returnToHand?: () => void;
    returnToLibrary?: () => void;
    returnToField?: () => void;
    read?: () => void;
    tap?: () => void;
    untap?: () => void;
    attack?: () => void;
    block?: () => void;
  };
  // Context to determine which buttons to show
  context?: 'hand' | 'battlefield' | 'graveyard' | 'exile' | 'library' | 'command';
  // Player ID for activated abilities
  playerId?: string;
}

const MtgCard = ({
  card,
  className = "",
  showName = false,
  showManaCost = false,
  showTimestamp = false,
  timestamp,
  isCommander = false,
  canPlayLand,
  isLand,
  isTapped,
  canUntap,
  isAttacking,
  canAttack,
  canBlock,
  damage,
  showOverlay = true,
  actions = {},
  context = 'hand',
  playerId
}: MtgCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const { activePlayerId, getActivatableAbilities, activateAbility } = useDeck();

  const handleReadCard = () => {
    if (actions.read) {
      actions.read();
    } else {
      setShowModal(true);
    }
  };

  const getContextButtons = () => {
    const buttons = [];
    
    // Get activatable abilities for battlefield context
    const currentPlayerId = playerId || activePlayerId;
    const activatableAbilities = (context === 'battlefield' && card.activatedAbilities) 
      ? getActivatableAbilities(currentPlayerId, card)
      : [];

    // Add activated ability buttons first (they're most important)
    if (activatableAbilities.length > 0 && context === 'battlefield') {
      activatableAbilities.forEach((ability, index) => {
        const buttonText = ability.cost === 'T' ? 'Tap' : 
                          ability.cost.match(/^\d+$/) ? `${ability.cost} Mana` : 
                          ability.cost;
        
        buttons.push(
          <button
            key={`ability-${index}`}
            className="text-white bg-purple-600 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-purple-700 transition-colors"
            onClick={() => activateAbility(currentPlayerId, card, ability)}
            title={ability.description}
          >
            {buttonText}
          </button>
        );
      });
    }

    // Always show read card button
    buttons.push(
      <button
        key="read"
        className="text-white bg-blue-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
        onClick={handleReadCard}
        title="Read Card"
      >
        Read
      </button>
    );

    // Context-specific buttons
    switch (context) {
      case 'hand':
        if (actions.play) {
          // Check if this is a land and if land can be played
          const isLandCard = isLand || card.type?.toLowerCase().includes('land');
          const canPlay = !isLandCard || canPlayLand !== false;
          
          buttons.push(
            <button
              key="play"
              className={`text-white text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer transition-colors ${
                canPlay 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={canPlay ? actions.play : undefined}
              title={canPlay ? "Play Card" : "Cannot play land - already played one this turn"}
            >
              {isLandCard && !canPlay ? "Cannot Play" : "Play"}
            </button>
          );
        }
        if (actions.discard) {
          buttons.push(
            <button
              key="discard"
              className="text-white bg-red-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
              onClick={actions.discard}
              title="Discard Card"
            >
              Discard
            </button>
          );
        }
        if (actions.exile) {
          buttons.push(
            <button
              key="exile"
              className="text-white bg-purple-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-purple-600 transition-colors"
              onClick={actions.exile}
              title="Exile Card"
            >
              Exile
            </button>
          );
        }
        break;

      case 'battlefield':
        if (actions.discard) {
          buttons.push(
            <button
              key="destroy"
              className="text-white bg-red-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
              onClick={actions.discard}
              title="Destroy Permanent"
            >
              Destroy
            </button>
          );
        }
        if (actions.exile) {
          buttons.push(
            <button
              key="exile"
              className="text-white bg-purple-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-purple-600 transition-colors"
              onClick={actions.exile}
              title="Exile Permanent"
            >
              Exile
            </button>
          );
        }
        if (actions.returnToHand) {
          buttons.push(
            <button
              key="bounce"
              className="text-white bg-blue-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={actions.returnToHand}
              title="Return to Hand"
            >
              Bounce
            </button>
          );
        }
        // Tap/untap actions for lands and creatures
          if (!isTapped && actions.tap) {
            buttons.push(
              <button
                key="tap"
                className="text-white bg-yellow-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-yellow-600 transition-colors"
                onClick={actions.tap}
              title={isLand ? "Tap Land" : "Tap Creature"}
              >
                Tap
              </button>
            );
          }
          if (isTapped && actions.untap) {
            buttons.push(
              <button
                key="untap"
                className={`text-white text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer transition-colors ${
                  canUntap 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={canUntap ? actions.untap : undefined}
              title={canUntap ? (isLand ? "Untap Land" : "Untap Creature") : "Cannot untap - used this turn"}
              >
                {canUntap ? "Untap" : "Used"}
              </button>
            );
          }
        // Combat actions for creatures
        if (canAttack && actions.attack) {
          buttons.push(
            <button
              key="attack"
              className="text-white bg-red-600 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-red-700 transition-colors"
              onClick={actions.attack}
              title="Declare as Attacker"
            >
              Attack
            </button>
          );
        }
        if (canBlock && actions.block) {
          buttons.push(
            <button
              key="block"
              className="text-white bg-blue-600 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
              onClick={actions.block}
              title="Declare as Blocker"
            >
              Block
            </button>
          );
        }
        break;

      case 'graveyard':
        if (actions.returnToHand) {
          buttons.push(
            <button
              key="return"
              className="text-white bg-green-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-green-600 transition-colors"
              onClick={actions.returnToHand}
              title="Return to Hand"
            >
              Return
            </button>
          );
        }
        if (actions.returnToField) {
          buttons.push(
            <button
              key="returnToField"
              className="text-white bg-orange-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-orange-600 transition-colors"
              onClick={actions.returnToField}
              title="Return to Field"
            >
              To Field
            </button>
          );
        }
        if (actions.returnToLibrary) {
          buttons.push(
            <button
              key="shuffle"
              className="text-white bg-blue-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={actions.returnToLibrary}
              title="Shuffle into Library"
            >
              Shuffle
            </button>
          );
        }
        if (actions.exile) {
          buttons.push(
            <button
              key="exile"
              className="text-white bg-purple-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-purple-600 transition-colors"
              onClick={actions.exile}
              title="Exile from Graveyard"
            >
              Exile
            </button>
          );
        }
        break;

      case 'exile':
        if (actions.returnToHand) {
          buttons.push(
            <button
              key="return"
              className="text-white bg-green-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-green-600 transition-colors"
              onClick={actions.returnToHand}
              title="Return to Hand"
            >
              Return
            </button>
          );
        }
        if (actions.exile) {
          buttons.push(
            <button
              key="toGraveyard"
              className="text-white bg-gray-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={actions.exile}
              title="Move to Graveyard"
            >
              To GY
            </button>
          );
        }
        if (actions.returnToField) {
          buttons.push(
            <button
              key="returnToField"
              className="text-white bg-orange-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-orange-600 transition-colors"
              onClick={actions.returnToField}
              title="Return to Field"
            >
              To Field
            </button>
          );
        }
        if (actions.returnToLibrary) {
          buttons.push(
            <button
              key="shuffle"
              className="text-white bg-blue-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={actions.returnToLibrary}
              title="Shuffle into Library"
            >
              Shuffle
            </button>
          );
        }
        break;

      case 'command':
        // Commander zone - limited actions
        if (actions.play) {
          buttons.push(
            <button
              key="cast"
              className="text-white bg-yellow-500 text-xs font-semibold px-2 py-1 rounded shadow-lg cursor-pointer hover:bg-yellow-600 transition-colors"
              onClick={actions.play}
              title="Cast Commander"
            >
              Cast
            </button>
          );
        }
        break;
    }

    return buttons;
  };

  return (
    <>
      <div
        className={`w-32 h-44 bg-white rounded-lg shadow-sm relative group ${className} ${
          isTapped ? 'rotate-90' : ''
        }`}
      >
        {isCommander && (
          <div className="absolute -top-2 -right-2 z-10 bg-black rounded-full p-1 shadow-lg">
            <div className="text-yellow-400 text-sm">👑</div>
          </div>
        )}

        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className={`w-full h-full rounded-lg object-cover ${
              isAttacking ? 'border-2 border-red-500 shadow-red-500' : ''
            }`}
          />
        ) : (
          <div className={`w-full h-full bg-gray-300 rounded-lg flex items-center justify-center ${
            isAttacking ? 'border-2 border-red-500 shadow-red-500' : ''
          }`}>
            <span className="text-gray-500 text-xs">No image</span>
          </div>
        )}

        {/* Permanent Card Info Overlay - always visible */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-70 text-white text-xs p-1 rounded-t-lg">
          <div className="flex justify-between items-center">
            {/* Mana Cost */}
            {card.mana_cost && (
              <span className="font-bold">{card.mana_cost}</span>
            )}
            {/* Power/Toughness for creatures */}
            {card.power && card.toughness && (
              <span className="font-bold">{card.power}/{card.toughness}</span>
            )}
          </div>
        </div>

        {/* Attacking indicator */}
        {isAttacking && (
          <div className="absolute -top-2 -left-2 z-10 bg-red-500 rounded-full p-1 shadow-lg">
            <div className="text-white text-xs">⚔️</div>
          </div>
        )}

        {/* Damage indicator */}
        {damage !== undefined && damage > 0 && (
          <>
            {/* Semi-transparent red overlay - darker if close to death */}
            <div className={`absolute inset-0 rounded-lg z-15 ${
              card.toughness && damage >= parseInt(card.toughness) * 0.8 
                ? 'bg-red-600 bg-opacity-50' 
                : 'bg-red-500 bg-opacity-30'
            }`}></div>
            {/* Damage counter in top-right corner */}
            <div className={`absolute top-1 right-1 z-30 text-white text-sm font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white ${
              card.toughness && damage >= parseInt(card.toughness) * 0.8 
                ? 'bg-red-800' 
                : 'bg-red-700'
            }`}>
              -{damage}
            </div>
            {/* Damage text overlay */}
            <div className="absolute bottom-1 left-1 z-30 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              DAMAGE
            </div>
            {/* Warning indicator if creature is close to death */}
            {card.toughness && damage >= parseInt(card.toughness) * 0.8 && (
              <div className="absolute top-1 left-1 z-30 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white animate-pulse">
                ⚠️
              </div>
            )}
          </>
        )}

        {/* Land play restriction indicator - centered */}
        {isLand && canPlayLand === false && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="text-red-600 text-2xl font-bold drop-shadow-lg">
              🚫
            </div>
          </div>
        )}

        {/* Land untap restriction indicator - for tapped lands that can't be untapped */}
        {isLand && isTapped && canUntap === false && (
          <div className="absolute top-1 right-1 z-5">
            <div className="text-red-500 text-lg drop-shadow-lg">
              🚫
            </div>
          </div>
        )}

        {/* Action Buttons Overlay - only on hover, no scaling */}
        {showOverlay && (
          <div className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 bg-gray-900/80 backdrop-blur-sm z-10 transition-opacity duration-200">
          {getContextButtons()}
        </div>
        )}

        {(showName || showManaCost || showTimestamp) && (
          <div className="mt-2">
            {showName && (
              <p className="font-semibold text-sm truncate">{card.name}</p>
            )}
            {showManaCost && (
              <p className="text-xs text-gray-600">{card.mana_cost}</p>
            )}
            {showTimestamp && timestamp && (
              <p className="text-xs text-gray-500">
                Drawn: {timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
          style={{ backdropFilter: "blur(2px)", zIndex: 999999 }}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{card.name}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* High-definition card image */}
              <div className="flex justify-center">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ imageRendering: "auto" }}
                  />
                ) : (
                  <div className="w-64 h-88 bg-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>

              {/* Card details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Card Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {card.mana_cost && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">
                          Mana Cost:
                        </span>
                        <span className="text-gray-900">{card.mana_cost}</span>
                      </div>
                    )}
                    {card.cmc !== undefined && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">
                          CMC:
                        </span>
                        <span className="text-gray-900">{card.cmc}</span>
                      </div>
                    )}
                    {card.type && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">
                          Type:
                        </span>
                        <span className="text-gray-900">{card.type}</span>
                      </div>
                    )}
                    {card.rarity && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">
                          Rarity:
                        </span>
                        <span className="text-gray-900 capitalize">
                          {card.rarity}
                        </span>
                      </div>
                    )}
                    {card.set_name && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">
                          Set:
                        </span>
                        <span className="text-gray-900">{card.set_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {card.text && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Card Text
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                      {card.text}
                    </div>
                  </div>
                )}

                {card.power && card.toughness && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">
                      Power/Toughness:
                    </span>
                    <span className="text-gray-900">
                      {card.power}/{card.toughness}
                      {damage !== undefined && damage > 0 && (
                        <span className="text-red-600 font-bold ml-2">
                          (-{damage} damage)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MtgCard;
