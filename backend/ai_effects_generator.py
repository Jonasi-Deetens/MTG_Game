import os
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import openai
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

class AIEffectsGenerator:
    def __init__(self):
        self.effect_types = [
            "DAMAGE", "DRAW", "LIFE_GAIN", "DESTROY", "SCRY", "MANA", 
            "BUFF", "DEBUFF", "SEARCH", "DISCARD", "COUNTER", "PROTECTION"
        ]
        
        self.keywords = [
            "FLYING", "FIRST_STRIKE", "DOUBLE_STRIKE", "TRAMPLE", "VIGILANCE",
            "HASTE", "LIFELINK", "DEATHTOUCH", "REACH", "HEXPROOF", 
            "INDESTRUCTIBLE", "MENACE", "PROWESS", "FLASH"
        ]
        
        self.target_types = [
            "creature", "player", "creature_or_player", "planeswalker",
            "artifact", "enchantment", "land", "any", "opponent"
        ]
    
    def generate_card_effects(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI effects for a card based on its properties"""
        try:
            start_time = datetime.now()
            
            # Create a prompt based on the card
            prompt = self._create_effect_prompt(card_data)
            
            # Generate effects using OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert Magic: The Gathering card designer. Generate balanced, thematic effects for cards based on their existing properties. Return valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            # Parse the AI response
            ai_content = response.choices[0].message.content.strip()
            
            # Try to extract JSON from the response
            effects_data = self._parse_ai_response(ai_content)
            
            # Add metadata
            effects_data['generation_time'] = (datetime.now() - start_time).total_seconds()
            effects_data['ai_model'] = "gpt-3.5-turbo"
            effects_data['raw_response'] = ai_content
            
            return effects_data
            
        except Exception as e:
            logger.error(f"Error generating effects for {card_data.get('name')}: {str(e)}")
            return self._get_fallback_effects(card_data)
    
    def _create_effect_prompt(self, card_data: Dict[str, Any]) -> str:
        """Create a prompt for AI effect generation"""
        name = card_data.get('name', 'Unknown')
        mana_cost = card_data.get('mana_cost', '')
        cmc = card_data.get('cmc', 0)
        type_line = card_data.get('type_line', '')
        oracle_text = card_data.get('oracle_text', '')
        power = card_data.get('power', '')
        toughness = card_data.get('toughness', '')
        colors = card_data.get('colors', [])
        rarity = card_data.get('rarity', '')
        
        prompt = f"""
Create balanced MTG effects for this card:

**Card Details:**
- Name: {name}
- Mana Cost: {mana_cost}
- CMC: {cmc}
- Type: {type_line}
- Power/Toughness: {power}/{toughness}
- Colors: {', '.join(colors) if colors else 'Colorless'}
- Rarity: {rarity}
- Original Text: {oracle_text}

**Guidelines:**
- Effects should be balanced for the mana cost
- Consider the card's colors and rarity
- Create 1-3 spell effects that fit the theme
- Add appropriate keywords if it's a creature
- Include activated abilities if suitable
- Provide strategic analysis

**Required JSON Format:**
{{
    "spell_effects": [
        {{
            "type": "DAMAGE|DRAW|LIFE_GAIN|DESTROY|etc",
            "value": number,
            "targetType": "creature|player|creature_or_player|etc",
            "description": "Clear effect description",
            "requiresTarget": boolean
        }}
    ],
    "keywords": ["FLYING", "HASTE", etc],
    "activated_abilities": [
        {{
            "id": "unique_id",
            "cost": "mana_cost_or_T",
            "effect": {{effect_object}},
            "description": "Full ability text"
        }}
    ],
    "ai_effect_description": "How these effects work together",
    "ai_strategic_value": "Strategic value and deck synergies",
    "ai_combo_potential": "Potential combos and interactions"
}}

Generate creative but balanced effects:
"""
        return prompt
    
    def _parse_ai_response(self, ai_content: str) -> Dict[str, Any]:
        """Parse AI response and extract JSON"""
        try:
            # Try to find JSON in the response
            start_idx = ai_content.find('{')
            end_idx = ai_content.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = ai_content[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse AI response as JSON: {str(e)}")
            # Return a structured fallback based on text analysis
            return self._analyze_text_response(ai_content)
    
    def _analyze_text_response(self, text: str) -> Dict[str, Any]:
        """Analyze text response and create structured effects"""
        effects = []
        keywords = []
        abilities = []
        
        # Simple text analysis to extract effects
        text_lower = text.lower()
        
        # Detect damage effects
        if any(word in text_lower for word in ['damage', 'deal', 'burn']):
            effects.append({
                "type": "DAMAGE",
                "value": 2,
                "targetType": "creature_or_player",
                "description": "Deal 2 damage to target creature or player",
                "requiresTarget": True
            })
        
        # Detect draw effects
        if any(word in text_lower for word in ['draw', 'card']):
            effects.append({
                "type": "DRAW",
                "value": 1,
                "description": "Draw a card",
                "requiresTarget": False
            })
        
        # Detect keywords
        for keyword in self.keywords:
            if keyword.lower() in text_lower:
                keywords.append(keyword)
        
        return {
            "spell_effects": effects,
            "keywords": keywords[:3],  # Limit to 3 keywords
            "activated_abilities": abilities,
            "ai_effect_description": "AI-generated effects based on card analysis",
            "ai_strategic_value": "Provides utility and board presence",
            "ai_combo_potential": "Synergizes with similar card types"
        }
    
    def _get_fallback_effects(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get fallback effects based on card type"""
        type_line = card_data.get('type_line', '').lower()
        colors = card_data.get('colors', [])
        cmc = card_data.get('cmc', 0)
        
        effects = []
        keywords = []
        abilities = []
        
        # Basic effects based on card type and colors
        if 'creature' in type_line:
            if 'red' in [c.lower() for c in colors]:
                keywords.append('HASTE')
            if 'white' in [c.lower() for c in colors]:
                keywords.append('VIGILANCE')
            if 'blue' in [c.lower() for c in colors]:
                keywords.append('FLYING')
            if 'black' in [c.lower() for c in colors]:
                keywords.append('DEATHTOUCH')
            if 'green' in [c.lower() for c in colors]:
                keywords.append('TRAMPLE')
        
        if 'instant' in type_line or 'sorcery' in type_line:
            if 'red' in [c.lower() for c in colors]:
                effects.append({
                    "type": "DAMAGE",
                    "value": min(cmc, 4),
                    "targetType": "creature_or_player",
                    "description": f"Deal {min(cmc, 4)} damage to target creature or player",
                    "requiresTarget": True
                })
        
        return {
            "spell_effects": effects,
            "keywords": keywords,
            "activated_abilities": abilities,
            "ai_effect_description": "Fallback effects based on card colors and type",
            "ai_strategic_value": "Standard utility for its type and cost",
            "ai_combo_potential": "Basic synergies with cards of similar type"
        }
    
    def generate_batch_effects(self, cards: List[Dict[str, Any]], 
                             delay: float = 1.0) -> List[Dict[str, Any]]:
        """Generate effects for a batch of cards with rate limiting"""
        results = []
        
        for i, card in enumerate(cards):
            logger.info(f"Generating effects for card {i+1}/{len(cards)}: {card.get('name')}")
            
            effects = self.generate_card_effects(card)
            
            # Add the generated effects to the card data
            enhanced_card = {**card}
            enhanced_card.update({
                'ai_generated_effects': effects.get('spell_effects', []),
                'ai_generated_abilities': effects.get('activated_abilities', []),
                'ai_generated_keywords': effects.get('keywords', []),
                'ai_effect_description': effects.get('ai_effect_description', ''),
                'ai_strategic_value': effects.get('ai_strategic_value', ''),
                'ai_combo_potential': effects.get('ai_combo_potential', '')
            })
            
            results.append(enhanced_card)
            
            # Rate limiting
            if i < len(cards) - 1:
                time.sleep(delay)
        
        return results

# Global AI generator instance
ai_generator = AIEffectsGenerator()