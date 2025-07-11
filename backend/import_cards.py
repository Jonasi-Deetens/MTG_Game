#!/usr/bin/env python3
"""
Simple MTG Card Import Script

This script does exactly what you asked for:
1. Gets all cards from Scryfall API
2. Generates AI effects for each card 
3. Saves to PostgreSQL database

Usage:
    python import_cards.py                    # Import all cards
    python import_cards.py --limit 1000      # Import first 1000 cards
    python import_cards.py --skip-ai         # Import without AI effects
"""

import os
import json
import time
import requests
import argparse
from datetime import datetime
from dotenv import load_dotenv
from database import get_db
from ai_effects_generator import ai_generator

# Load environment variables
load_dotenv()

def log(message):
    """Simple logging"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def get_all_cards_from_scryfall(limit=None):
    """
    Get all cards from Scryfall API
    Returns list of card dictionaries
    """
    log("🔍 Fetching cards from Scryfall API...")
    
    base_url = "https://api.scryfall.com"
    all_cards = []
    page = 1
    
    while True:
        log(f"   Fetching page {page}...")
        
        # Query all paper cards
        url = f"{base_url}/cards/search"
        params = {
            'q': 'game:paper -is:digital',  # Only paper cards
            'page': page,
            'format': 'json',
            'order': 'name'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 404:
            log("   No more pages found")
            break
        elif response.status_code != 200:
            log(f"❌ API Error: {response.status_code}")
            break
        
        data = response.json()
        page_cards = data.get('data', [])
        
        if not page_cards:
            break
        
        # Process cards from this page
        for card in page_cards:
            processed_card = process_scryfall_card(card)
            if processed_card:
                all_cards.append(processed_card)
        
        log(f"   Got {len(page_cards)} cards. Total: {len(all_cards)}")
        
        # Check limits
        if limit and len(all_cards) >= limit:
            log(f"   Reached limit of {limit} cards")
            all_cards = all_cards[:limit]
            break
        
        # Check if there are more pages
        if not data.get('has_more', False):
            break
        
        page += 1
        time.sleep(0.1)  # Rate limiting
    
    log(f"✅ Fetched {len(all_cards)} cards from Scryfall")
    return all_cards

def process_scryfall_card(card):
    """
    Convert Scryfall card data to our format
    """
    try:
        # Handle image URLs
        image_url = None
        if card.get('image_uris'):
            image_url = card['image_uris'].get('normal') or card['image_uris'].get('small')
        elif card.get('card_faces') and card['card_faces'][0].get('image_uris'):
            image_url = card['card_faces'][0]['image_uris'].get('normal')
        
        # Handle double-faced cards
        if card.get('card_faces') and len(card['card_faces']) > 0:
            front_face = card['card_faces'][0]
            name = front_face.get('name', card.get('name'))
            mana_cost = front_face.get('mana_cost', '')
            type_line = front_face.get('type_line', card.get('type_line', ''))
            oracle_text = front_face.get('oracle_text', '')
            power = front_face.get('power')
            toughness = front_face.get('toughness')
        else:
            name = card.get('name')
            mana_cost = card.get('mana_cost', '')
            type_line = card.get('type_line', '')
            oracle_text = card.get('oracle_text', '')
            power = card.get('power')
            toughness = card.get('toughness')
        
        return {
            'scryfall_id': card.get('id'),
            'name': name,
            'mana_cost': mana_cost,
            'cmc': card.get('cmc', 0),
            'type_line': type_line,
            'oracle_text': oracle_text,
            'power': power,
            'toughness': toughness,
            'colors': card.get('colors', []),
            'keywords': card.get('keywords', []),
            'rarity': card.get('rarity'),
            'set_code': card.get('set'),
            'set_name': card.get('set_name'),
            'collector_number': card.get('collector_number'),
            'image_url': image_url,
            'prices': card.get('prices', {}),
            'legalities': card.get('legalities', {}),
            'flavor_text': card.get('flavor_text'),
            'artist': card.get('artist')
        }
        
    except Exception as e:
        log(f"❌ Error processing card {card.get('name', 'Unknown')}: {e}")
        return None

def add_ai_effects_to_cards(cards, skip_ai=False):
    """
    Add AI-generated effects to cards
    """
    if skip_ai:
        log("⏭️  Skipping AI effect generation")
        for card in cards:
            card.update({
                'ai_generated_effects': [],
                'ai_generated_abilities': [],
                'ai_generated_keywords': [],
                'ai_effect_description': 'AI generation skipped',
                'ai_strategic_value': 'Not analyzed',
                'ai_combo_potential': 'Not analyzed'
            })
        return cards
    
    log("🤖 Generating AI effects for cards...")
    
    enhanced_cards = []
    batch_size = 50
    
    for i in range(0, len(cards), batch_size):
        batch = cards[i:i + batch_size]
        log(f"   Processing batch {i//batch_size + 1}: cards {i+1}-{min(i+batch_size, len(cards))}")
        
        try:
            enhanced_batch = ai_generator.generate_batch_effects(batch, delay=0.5)
            enhanced_cards.extend(enhanced_batch)
        except Exception as e:
            log(f"❌ AI generation failed for batch: {e}")
            # Add cards without AI effects as fallback
            for card in batch:
                card.update({
                    'ai_generated_effects': [],
                    'ai_generated_abilities': [],
                    'ai_generated_keywords': [],
                    'ai_effect_description': 'AI generation failed',
                    'ai_strategic_value': 'Unknown',
                    'ai_combo_potential': 'Unknown'
                })
            enhanced_cards.extend(batch)
    
    log(f"✅ AI effects generated for {len(enhanced_cards)} cards")
    return enhanced_cards

def save_cards_to_database(cards):
    """
    Save cards to PostgreSQL database
    """
    log("💾 Saving cards to database...")
    
    db = get_db()
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for i, card in enumerate(cards):
        try:
            # Check if card already exists
            if db.card_exists(card['scryfall_id']):
                skip_count += 1
                continue
            
            # Insert card
            if db.insert_card(card):
                success_count += 1
            else:
                error_count += 1
                log(f"❌ Failed to insert: {card['name']}")
            
            # Progress update
            if (i + 1) % 100 == 0:
                log(f"   Progress: {i+1}/{len(cards)} cards processed")
            
        except Exception as e:
            error_count += 1
            log(f"❌ Error saving card {card['name']}: {e}")
    
    log(f"✅ Database save complete!")
    log(f"   Inserted: {success_count}")
    log(f"   Skipped (existing): {skip_count}")
    log(f"   Errors: {error_count}")
    
    return success_count

def main():
    """
    Main import function
    """
    parser = argparse.ArgumentParser(description='Import MTG cards from Scryfall with AI effects')
    parser.add_argument('--limit', type=int, help='Limit number of cards to import')
    parser.add_argument('--skip-ai', action='store_true', help='Skip AI effect generation')
    parser.add_argument('--estimate', action='store_true', help='Just estimate the operation')
    
    args = parser.parse_args()
    
    if args.estimate:
        log("📊 Estimating import operation...")
        try:
            response = requests.get("https://api.scryfall.com/cards/search?q=game:paper+-is:digital&page=1")
            if response.status_code == 200:
                data = response.json()
                total_cards = data.get('total_cards', 0)
                
                if args.limit:
                    total_cards = min(total_cards, args.limit)
                
                cost_per_card = 0.002 if not args.skip_ai else 0
                total_cost = total_cards * cost_per_card
                time_per_card = 2 if not args.skip_ai else 0.1
                total_time_hours = (total_cards * time_per_card) / 3600
                
                log(f"📈 Import Estimates:")
                log(f"   Total Cards: {total_cards:,}")
                log(f"   Estimated Cost: ${total_cost:.2f}")
                log(f"   Estimated Time: {total_time_hours:.1f} hours")
                log(f"   AI Effects: {'Yes' if not args.skip_ai else 'No'}")
            else:
                log("❌ Failed to get card count estimate")
        except Exception as e:
            log(f"❌ Error getting estimate: {e}")
        return
    
    log("🚀 Starting MTG card import...")
    
    # Step 1: Get all cards from Scryfall
    cards = get_all_cards_from_scryfall(limit=args.limit)
    
    if not cards:
        log("❌ No cards found to import")
        return
    
    # Step 2: Add AI effects
    enhanced_cards = add_ai_effects_to_cards(cards, skip_ai=args.skip_ai)
    
    # Step 3: Save to database
    success_count = save_cards_to_database(enhanced_cards)
    
    log(f"🎉 Import complete! Successfully imported {success_count} cards.")
    log("   Your frontend can now get all card data from the database!")

if __name__ == "__main__":
    main()