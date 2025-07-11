from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from database import get_db

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
db = get_db()

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

@app.route('/api/cards', methods=['GET'])
def get_cards():
    """Get cards with optional filtering and pagination"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        card_type = request.args.get('type')
        name_query = request.args.get('name')
        rarity = request.args.get('rarity')
        colors = request.args.get('colors')
        
        offset = (page - 1) * limit
        
        # Build query
        where_conditions = []
        params = []
        
        if card_type:
            where_conditions.append("type_line ILIKE %s")
            params.append(f'%{card_type}%')
        
        if name_query:
            where_conditions.append("name ILIKE %s")
            params.append(f'%{name_query}%')
        
        if rarity:
            where_conditions.append("rarity = %s")
            params.append(rarity)
        
        if colors:
            color_list = [c.strip().upper() for c in colors.split(',')]
            where_conditions.append("colors && %s")
            params.append(json.dumps(color_list))
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "TRUE"
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM cards WHERE {where_clause}"
        total_result = db.execute_query(count_query, tuple(params))
        total = total_result[0]['total'] if total_result else 0
        
        # Get cards
        query = f"""
            SELECT 
                scryfall_id, name, mana_cost, cmc, type_line, oracle_text,
                power, toughness, colors, keywords, rarity, set_code, set_name,
                image_url, ai_generated_effects, ai_generated_keywords,
                ai_generated_abilities, ai_effect_description, ai_strategic_value
            FROM cards 
            WHERE {where_clause}
            ORDER BY name 
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        
        cards = db.execute_query(query, tuple(params))
        
        return jsonify({
            'cards': cards,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/<card_id>', methods=['GET'])
def get_card_details(card_id):
    """Get detailed information about a specific card"""
    try:
        query = "SELECT * FROM cards WHERE scryfall_id = %s"
        result = db.execute_query(query, (card_id,))
        
        if not result:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify(result[0])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/search', methods=['GET'])
def search_cards():
    """Search for cards by name"""
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 10)), 50)
    
    if len(query) < 2:
        return jsonify([])
    
    try:
        cards = db.search_cards(query, limit)
        results = []
        
        for card in cards:
            results.append({
                'id': card['scryfall_id'],
                'name': card['name'],
                'mana_cost': card['mana_cost'],
                'type': card['type_line'],
                'image_url': card['image_url'],
                'colors': card['colors'],
                'cmc': card['cmc'],
                'rarity': card['rarity'],
                'ai_generated_effects': card.get('ai_generated_effects', []),
                'ai_generated_keywords': card.get('ai_generated_keywords', []),
                'ai_effect_description': card.get('ai_effect_description', '')
            })
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 