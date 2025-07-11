from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from dotenv import load_dotenv

from database import get_db
from scryfall_importer import ScryfallImporter

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
db = get_db()
importer = ScryfallImporter()

@app.route('/api/cards', methods=['GET'])
def get_cards():
    """Get cards with optional filtering"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)  # Cap at 100
        card_type = request.args.get('type')
        name_query = request.args.get('name')
        rarity = request.args.get('rarity')
        colors = request.args.get('colors')  # comma-separated
        
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
                ai_effect_description, ai_strategic_value
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

@app.route('/api/cards/<scryfall_id>', methods=['GET'])
def get_card_details(scryfall_id):
    """Get detailed information about a specific card"""
    try:
        query = "SELECT * FROM cards WHERE scryfall_id = %s"
        result = db.execute_query(query, (scryfall_id,))
        
        if not result:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify(result[0])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/search', methods=['GET'])
def search_cards():
    """Search cards by name"""
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 10)), 50)
    
    if len(query) < 2:
        return jsonify([])
    
    try:
        cards = db.search_cards(query, limit)
        return jsonify(cards)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/effects', methods=['GET'])
def get_cards_with_effects():
    """Get cards that have AI-generated effects"""
    try:
        limit = min(int(request.args.get('limit', 50)), 100)
        cards = db.get_cards_with_ai_effects(limit)
        return jsonify(cards)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/types', methods=['GET'])
def get_card_types():
    """Get all unique card types"""
    try:
        query = """
            SELECT DISTINCT 
                TRIM(regexp_split_to_table(type_line, '—')) as type_part
            FROM cards 
            WHERE type_line IS NOT NULL
            ORDER BY type_part
        """
        result = db.execute_query(query)
        types = [row['type_part'] for row in result if row['type_part'].strip()]
        return jsonify(types)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sets', methods=['GET'])
def get_sets():
    """Get all sets in the database"""
    try:
        query = """
            SELECT DISTINCT set_code, set_name, COUNT(*) as card_count
            FROM cards 
            WHERE set_code IS NOT NULL
            GROUP BY set_code, set_name
            ORDER BY set_name
        """
        sets = db.execute_query(query)
        return jsonify(sets)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/import/status', methods=['GET'])
def get_import_status():
    """Get import progress status"""
    try:
        status = importer.get_import_status()
        return jsonify(status)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/import/start', methods=['POST'])
def start_import():
    """Start importing cards from Scryfall"""
    try:
        data = request.json or {}
        sets = data.get('sets')  # Optional list of set codes
        max_cards = data.get('max_cards', 1000)
        
        # Override max cards
        os.environ['MAX_CARDS_TO_IMPORT'] = str(max_cards)
        
        # Start import in background (in a real app, use Celery or similar)
        import threading
        
        def run_import():
            try:
                if sets:
                    importer.import_specific_sets(sets)
                else:
                    importer.import_cards_with_ai_effects()
            except Exception as e:
                db.update_import_progress(status='failed', error=str(e))
        
        thread = threading.Thread(target=run_import)
        thread.daemon = True
        thread.start()
        
        return jsonify({'message': 'Import started', 'status': 'running'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        stats = {}
        
        # Total cards
        result = db.execute_query("SELECT COUNT(*) as total FROM cards")
        stats['total_cards'] = result[0]['total'] if result else 0
        
        # Cards with AI effects
        result = db.execute_query("""
            SELECT COUNT(*) as total FROM cards 
            WHERE ai_generated_effects IS NOT NULL 
            AND jsonb_array_length(ai_generated_effects) > 0
        """)
        stats['cards_with_ai_effects'] = result[0]['total'] if result else 0
        
        # Cards by rarity
        result = db.execute_query("""
            SELECT rarity, COUNT(*) as count 
            FROM cards 
            WHERE rarity IS NOT NULL
            GROUP BY rarity 
            ORDER BY count DESC
        """)
        stats['by_rarity'] = {row['rarity']: row['count'] for row in result}
        
        # Cards by color
        result = db.execute_query("""
            SELECT 
                CASE 
                    WHEN jsonb_array_length(colors) = 0 THEN 'Colorless'
                    WHEN jsonb_array_length(colors) = 1 THEN colors->>0
                    ELSE 'Multicolor'
                END as color_category,
                COUNT(*) as count
            FROM cards 
            WHERE colors IS NOT NULL
            GROUP BY color_category
            ORDER BY count DESC
        """)
        stats['by_color'] = {row['color_category']: row['count'] for row in result}
        
        # Recent imports
        result = db.execute_query("""
            SELECT COUNT(*) as count 
            FROM cards 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        """)
        stats['imported_last_24h'] = result[0]['count'] if result else 0
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Legacy deck endpoints (keeping for backward compatibility)
@app.route('/api/decks', methods=['GET'])
def get_decks():
    """Legacy endpoint - could be enhanced to work with new card database"""
    return jsonify([])

@app.route('/api/decks', methods=['POST'])
def create_deck():
    """Legacy endpoint - could be enhanced to work with new card database"""
    return jsonify({'message': 'Deck creation not implemented yet'}), 501

if __name__ == '__main__':
    app.run(debug=True, port=5001)