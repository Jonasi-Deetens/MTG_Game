from flask import Flask, request, jsonify
from flask_cors import CORS
from mtgsdk import Card
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database file path
DB_FILE = 'decks.json'

def load_decks():
    """Load decks from JSON file"""
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('decks', {})
        return {}
    except (json.JSONDecodeError, FileNotFoundError, IOError) as e:
        print(f"Error loading decks: {str(e)}")
        return {}

def save_decks(decks):
    """Save decks to JSON file"""
    try:
        data = {'decks': decks}
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except (IOError, TypeError, ValueError) as e:
        print(f"Error saving decks: {str(e)}")
        return False

def get_next_id(decks):
    """Get next available deck ID"""
    if not decks:
        return 1
    return max(int(k) for k in decks.keys()) + 1

@app.route('/api/decks', methods=['GET'])
def get_decks():
    """Get all decks"""
    try:
        decks = load_decks()
        
        # Convert to list format for frontend
        deck_list = []
        for deck_id, deck in decks.items():
            try:
                # Ensure the deck has the expected structure
                if not isinstance(deck, dict):
                    continue
                    
                if 'id' not in deck:
                    deck['id'] = int(deck_id)
                if 'cards' not in deck:
                    deck['cards'] = []
                if 'legendary_creatures' not in deck:
                    deck['legendary_creatures'] = []
                if 'created_at' not in deck:
                    deck['created_at'] = datetime.now().isoformat()
                if 'updated_at' not in deck:
                    deck['updated_at'] = datetime.now().isoformat()
                
                deck_list.append(deck)
                
            except (TypeError, ValueError, KeyError) as e:
                print(f"Skipping corrupted deck {deck_id}: {str(e)}")
                continue
        
        return jsonify(deck_list)
    except Exception as e:
        print(f"Error getting decks: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/decks', methods=['POST'])
def create_deck():
    """Create a new deck"""
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        commander_id = data.get('commander_id')
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        # Load existing decks
        decks = load_decks()
        deck_id = get_next_id(decks)
        
        # Check if this is optimized data (with full card information)
        if 'cards' in data:
            # Optimized flow: cards already have full data
            cards = data.get('cards', [])
            legendary_creatures = []
            
            # Extract legendary creatures from the cards
            for card in cards:
                if card.get('type') and 'Legendary' in card.get('type') and 'Creature' in card.get('type'):
                    legendary_creatures.append({
                        'id': card.get('id', ''),
                        'name': card.get('name', ''),
                        'mana_cost': card.get('mana_cost', '')
                    })
            
            # Create deck object with optimized data
            deck = {
                'id': deck_id,
                'name': name,
                'description': description,
                'commander_id': commander_id,
                'cards': cards,
                'legendary_creatures': legendary_creatures,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Save the deck
            decks[str(deck_id)] = deck
            if save_decks(decks):
                return jsonify(deck), 201
            else:
                return jsonify({'error': 'Failed to save deck'}), 500
            
        else:
            # Legacy flow: process deck list and fetch card data
            deck_list = data.get('deck_list', [])
            
            if not deck_list:
                return jsonify({'error': 'Deck list is required'}), 400
            
            # Process deck list and fetch card data
            processed_cards = []
            legendary_creatures = []
            
            for card_entry in deck_list:
                quantity = card_entry.get('quantity', 1)
                card_name = card_entry.get('name', '').strip()
                
                if not card_name:
                    continue
                    
                # Search for the card using mtgsdk
                cards = Card.where(name=card_name).all()
                
                if cards:
                    card = cards[0]  # Take the first match
                    card_data = {
                        'quantity': quantity,
                        'name': card.name,
                        'mana_cost': card.mana_cost,
                        'cmc': card.cmc,
                        'colors': card.colors,
                        'type': card.type,
                        'text': card.text,
                        'power': card.power,
                        'toughness': card.toughness,
                        'image_url': card.image_url,
                        'id': card.id,
                        'rarity': card.rarity,
                        'set': card.set,
                        'set_name': card.set_name
                    }
                    
                    processed_cards.append(card_data)
                    
                    # Check if it's a legendary creature for commander selection
                    if 'Legendary' in card.type and 'Creature' in card.type:
                        legendary_creatures.append({
                            'id': card.id,
                            'name': card.name,
                            'mana_cost': card.mana_cost
                        })
                else:
                    # If card not found, add with basic info
                    processed_cards.append({
                        'quantity': quantity,
                        'name': card_name,
                        'error': 'Card not found in database'
                    })
            
            # Create deck object
            deck = {
                'id': deck_id,
                'name': name,
                'description': description,
                'commander_id': commander_id,
                'cards': processed_cards,
                'legendary_creatures': legendary_creatures,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Save the deck
            decks[str(deck_id)] = deck
            if save_decks(decks):
                return jsonify(deck), 201
            else:
                return jsonify({'error': 'Failed to save deck'}), 500
        
    except Exception as e:
        print(f"Error creating deck: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/decks/<int:deck_id>', methods=['GET'])
def get_deck(deck_id):
    """Get a specific deck by ID"""
    try:
        decks = load_decks()
        deck = decks.get(str(deck_id))
        
        if deck:
            try:
                # Validate that the deck is a proper dictionary
                if not isinstance(deck, dict):
                    print(f"Deck {deck_id} is not a dictionary: {type(deck)}")
                    return jsonify({'error': 'Invalid deck data structure'}), 500
                
                # Ensure the deck has the expected structure
                if 'id' not in deck:
                    deck['id'] = deck_id
                if 'cards' not in deck:
                    deck['cards'] = []
                if 'legendary_creatures' not in deck:
                    deck['legendary_creatures'] = []
                if 'created_at' not in deck:
                    deck['created_at'] = datetime.now().isoformat()
                if 'updated_at' not in deck:
                    deck['updated_at'] = datetime.now().isoformat()
                    
                return jsonify(deck)
                
            except (TypeError, ValueError) as e:
                print(f"Deck {deck_id} has invalid data structure: {str(e)}")
                return jsonify({'error': 'Invalid deck data structure'}), 500
        else:
            return jsonify({'error': 'Deck not found'}), 404
            
    except Exception as e:
        print(f"Error getting deck {deck_id}: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/decks/<int:deck_id>', methods=['PUT'])
def update_deck(deck_id):
    """Update a deck"""
    try:
        decks = load_decks()
        deck = decks.get(str(deck_id))
        
        if not deck:
            return jsonify({'error': 'Deck not found'}), 404
        
        data = request.json
        
        if 'name' in data:
            deck['name'] = data['name']
        if 'description' in data:
            deck['description'] = data['description']
        if 'commander_id' in data:
            deck['commander_id'] = data['commander_id']
        
        deck['updated_at'] = datetime.now().isoformat()
        
        # Save the updated deck
        if save_decks(decks):
            return jsonify(deck)
        else:
            return jsonify({'error': 'Failed to save deck'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/decks/<int:deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    """Delete a deck"""
    try:
        decks = load_decks()
        deck = decks.get(str(deck_id))
        
        if not deck:
            return jsonify({'error': 'Deck not found'}), 404
        
        # Remove the deck
        del decks[str(deck_id)]
        
        if save_decks(decks):
            return jsonify({'message': 'Deck deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete deck'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/search', methods=['GET'])
def search_cards():
    """Search for cards by name"""
    query = request.args.get('q', '')
    
    if not query or len(query) < 2:
        return jsonify([])
    
    try:
        cards = Card.where(name=query).all()
        results = []
        
        for card in cards[:10]:  # Limit to 10 results
            results.append({
                'id': card.id,
                'name': card.name,
                'mana_cost': card.mana_cost,
                'type': card.type,
                'image_url': card.image_url
            })
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 