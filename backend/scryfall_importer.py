import os
import json
import time
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from dotenv import load_dotenv

from database import get_db
from ai_effects_generator import ai_generator

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('card_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScryfallImporter:
    def __init__(self):
        self.base_url = os.getenv('SCRYFALL_BASE_URL', 'https://api.scryfall.com')
        self.rate_limit = int(os.getenv('SCRYFALL_RATE_LIMIT', '100'))
        self.batch_size = int(os.getenv('BATCH_SIZE', '100'))
        self.max_cards = int(os.getenv('MAX_CARDS_TO_IMPORT', '1000'))
        self.db = get_db()
        
        # Rate limiting: Scryfall allows 10 requests per second
        self.request_delay = 0.1  # 100ms between requests
    
    def fetch_all_cards(self, sets: List[str] = None) -> List[Dict[str, Any]]:
        """Fetch all cards from Scryfall API with optional set filtering"""
        cards = []
        page = 1
        has_more = True
        
        # Update progress
        self.db.update_import_progress(status='running', total=0, processed=0, failed=0)
        
        try:
            while has_more and len(cards) < self.max_cards:
                logger.info(f"Fetching page {page}...")
                
                # Build query
                query_parts = []
                if sets:
                    set_query = " OR ".join([f"set:{s}" for s in sets])
                    query_parts.append(f"({set_query})")
                
                # Add basic filters
                query_parts.extend([
                    "game:paper",  # Only paper cards
                    "-is:digital"  # Exclude digital-only cards
                ])
                
                query = " ".join(query_parts) if query_parts else "game:paper"
                
                url = f"{self.base_url}/cards/search"
                params = {
                    'q': query,
                    'page': page,
                    'format': 'json',
                    'order': 'name'
                }
                
                response = requests.get(url, params=params)
                
                if response.status_code == 404:
                    logger.warning("No more cards found")
                    break
                elif response.status_code != 200:
                    logger.error(f"API Error: {response.status_code} - {response.text}")
                    break
                
                data = response.json()
                page_cards = data.get('data', [])
                
                if not page_cards:
                    break
                
                # Process cards from this page
                processed_cards = self._process_card_data(page_cards)
                cards.extend(processed_cards)
                
                # Update progress
                self.db.update_import_progress(
                    total=min(data.get('total_cards', len(cards)), self.max_cards),
                    processed=len(cards)
                )
                
                logger.info(f"Fetched {len(processed_cards)} cards from page {page}. Total: {len(cards)}")
                
                # Check if there are more pages
                has_more = data.get('has_more', False) and len(cards) < self.max_cards
                page += 1
                
                # Rate limiting
                time.sleep(self.request_delay)
            
        except Exception as e:
            logger.error(f"Error fetching cards: {str(e)}")
            self.db.update_import_progress(error=str(e))
            raise
        
        logger.info(f"Finished fetching. Total cards: {len(cards)}")
        return cards[:self.max_cards]
    
    def _process_card_data(self, raw_cards: List[Dict]) -> List[Dict[str, Any]]:
        """Process raw card data from Scryfall API"""
        processed = []
        
        for card in raw_cards:
            try:
                # Extract image URL (prefer normal, fallback to small)
                image_url = None
                if card.get('image_uris'):
                    image_url = card['image_uris'].get('normal') or card['image_uris'].get('small')
                elif card.get('card_faces') and card['card_faces'][0].get('image_uris'):
                    image_url = card['card_faces'][0]['image_uris'].get('normal') or card['card_faces'][0]['image_uris'].get('small')
                
                # Handle double-faced cards
                if card.get('card_faces') and len(card['card_faces']) > 0:
                    # Use the front face for basic properties
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
                
                processed_card = {
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
                
                processed.append(processed_card)
                
            except Exception as e:
                logger.error(f"Error processing card {card.get('name', 'Unknown')}: {str(e)}")
                continue
        
        return processed
    
    def import_cards_with_ai_effects(self, cards: List[Dict[str, Any]] = None):
        """Import cards to database with AI-generated effects"""
        if cards is None:
            logger.info("Fetching cards from Scryfall...")
            cards = self.fetch_all_cards()
        
        if not cards:
            logger.warning("No cards to import")
            return
        
        logger.info(f"Starting import of {len(cards)} cards with AI effects...")
        
        processed_count = 0
        failed_count = 0
        skipped_count = 0
        
        # Process in batches
        for i in range(0, len(cards), self.batch_size):
            batch = cards[i:i + self.batch_size]
            logger.info(f"Processing batch {i//self.batch_size + 1}: cards {i+1}-{min(i+self.batch_size, len(cards))}")
            
            # Check which cards already exist
            new_cards = []
            for card in batch:
                if not self.db.card_exists(card['scryfall_id']):
                    new_cards.append(card)
                else:
                    skipped_count += 1
                    logger.debug(f"Skipping existing card: {card['name']}")
            
            if not new_cards:
                logger.info("All cards in batch already exist, skipping...")
                continue
            
            # Generate AI effects for new cards
            logger.info(f"Generating AI effects for {len(new_cards)} new cards...")
            try:
                enhanced_cards = ai_generator.generate_batch_effects(new_cards, delay=0.5)
            except Exception as e:
                logger.error(f"Error generating AI effects for batch: {str(e)}")
                # Use cards without AI effects as fallback
                enhanced_cards = new_cards
                for card in enhanced_cards:
                    card.update({
                        'ai_generated_effects': [],
                        'ai_generated_abilities': [],
                        'ai_generated_keywords': [],
                        'ai_effect_description': 'Failed to generate AI effects',
                        'ai_strategic_value': 'Unknown',
                        'ai_combo_potential': 'Unknown'
                    })
            
            # Insert cards into database
            for card in enhanced_cards:
                try:
                    if self.db.insert_card(card):
                        processed_count += 1
                        logger.debug(f"Successfully imported: {card['name']}")
                    else:
                        failed_count += 1
                        logger.warning(f"Failed to import: {card['name']}")
                    
                    # Update progress
                    self.db.update_import_progress(
                        processed=processed_count + skipped_count,
                        failed=failed_count,
                        last_card=card['name']
                    )
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Error importing card {card['name']}: {str(e)}")
            
            logger.info(f"Batch complete. Processed: {processed_count}, Failed: {failed_count}, Skipped: {skipped_count}")
        
        # Mark import as complete
        self.db.update_import_progress(status='completed')
        
        logger.info(f"Import completed! Total processed: {processed_count}, Failed: {failed_count}, Skipped: {skipped_count}")
    
    def import_specific_sets(self, set_codes: List[str]):
        """Import cards from specific sets"""
        logger.info(f"Importing cards from sets: {', '.join(set_codes)}")
        cards = self.fetch_all_cards(sets=set_codes)
        self.import_cards_with_ai_effects(cards)
    
    def get_import_status(self) -> Dict[str, Any]:
        """Get current import status"""
        return self.db.get_import_progress()

def main():
    """Main function to run the importer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Import MTG cards from Scryfall with AI-generated effects')
    parser.add_argument('--sets', nargs='+', help='Specific set codes to import (e.g., NEO MID VOW)')
    parser.add_argument('--max-cards', type=int, default=1000, help='Maximum number of cards to import')
    parser.add_argument('--batch-size', type=int, default=50, help='Batch size for processing')
    
    args = parser.parse_args()
    
    # Override environment variables with command line args
    if args.max_cards:
        os.environ['MAX_CARDS_TO_IMPORT'] = str(args.max_cards)
    if args.batch_size:
        os.environ['BATCH_SIZE'] = str(args.batch_size)
    
    importer = ScryfallImporter()
    
    try:
        if args.sets:
            importer.import_specific_sets(args.sets)
        else:
            importer.import_cards_with_ai_effects()
    except KeyboardInterrupt:
        logger.info("Import interrupted by user")
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()