#!/usr/bin/env python3
"""
Full Scryfall Import Script
Imports ALL cards from Scryfall API with AI-generated effects
WARNING: This is a very large operation that may take hours/days
"""

import os
import json
import time
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv
from scryfall_importer import ScryfallImporter
from database import get_db
import logging

# Load environment variables
load_dotenv()

# Enhanced logging for full import
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('full_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FullScryfallImporter(ScryfallImporter):
    """Enhanced importer for full Scryfall database"""
    
    def __init__(self, resume_from_checkpoint=True):
        super().__init__()
        self.resume_from_checkpoint = resume_from_checkpoint
        self.checkpoint_file = 'import_checkpoint.json'
        
        # Remove limits for full import
        self.max_cards = 999999999  # Essentially unlimited
        self.batch_size = 50  # Smaller batches for stability
    
    def save_checkpoint(self, page: int, total_processed: int, last_card: str):
        """Save import progress to checkpoint file"""
        checkpoint = {
            'page': page,
            'total_processed': total_processed,
            'last_card': last_card,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(self.checkpoint_file, 'w') as f:
            json.dump(checkpoint, f, indent=2)
        
        logger.info(f"Checkpoint saved: Page {page}, Processed {total_processed}")
    
    def load_checkpoint(self):
        """Load checkpoint from file"""
        if not os.path.exists(self.checkpoint_file):
            return None
        
        try:
            with open(self.checkpoint_file, 'r') as f:
                checkpoint = json.load(f)
            logger.info(f"Checkpoint loaded: Page {checkpoint['page']}, Processed {checkpoint['total_processed']}")
            return checkpoint
        except Exception as e:
            logger.error(f"Error loading checkpoint: {e}")
            return None
    
    def estimate_full_import_stats(self):
        """Get statistics about the full import operation"""
        try:
            # Get total card count from Scryfall
            import requests
            response = requests.get(f"{self.base_url}/cards/search?q=game:paper+-is:digital&page=1")
            if response.status_code == 200:
                data = response.json()
                total_cards = data.get('total_cards', 0)
                
                # Estimate costs and time
                openai_cost_per_card = 0.002  # Rough estimate for GPT-3.5-turbo
                total_cost = total_cards * openai_cost_per_card
                
                # Time estimation (with delays)
                seconds_per_card = 2  # Including API calls and processing
                total_time = total_cards * seconds_per_card
                hours = total_time / 3600
                
                stats = {
                    'total_cards': total_cards,
                    'estimated_cost_usd': round(total_cost, 2),
                    'estimated_time_hours': round(hours, 1),
                    'estimated_time_days': round(hours / 24, 1),
                    'storage_estimate_gb': round(total_cards * 0.002, 2)  # ~2KB per card
                }
                
                return stats
            else:
                logger.error("Failed to get card count from Scryfall")
                return None
                
        except Exception as e:
            logger.error(f"Error estimating import stats: {e}")
            return None
    
    def full_import_with_resume(self, skip_ai_effects=False):
        """Import all cards with checkpoint/resume capability"""
        logger.info("🚀 Starting FULL Scryfall import...")
        
        # Show import statistics
        stats = self.estimate_full_import_stats()
        if stats:
            logger.info(f"📊 Full Import Statistics:")
            logger.info(f"   Total Cards: {stats['total_cards']:,}")
            logger.info(f"   Estimated Cost: ${stats['estimated_cost_usd']}")
            logger.info(f"   Estimated Time: {stats['estimated_time_hours']} hours ({stats['estimated_time_days']} days)")
            logger.info(f"   Storage Required: ~{stats['storage_estimate_gb']} GB")
            
            if not skip_ai_effects:
                response = input(f"\n⚠️  This will cost approximately ${stats['estimated_cost_usd']} in OpenAI API calls. Continue? (y/N): ")
                if response.lower() != 'y':
                    logger.info("Import cancelled by user")
                    return
        
        # Load checkpoint if resuming
        checkpoint = None
        if self.resume_from_checkpoint:
            checkpoint = self.load_checkpoint()
        
        start_page = checkpoint['page'] if checkpoint else 1
        total_processed = checkpoint['total_processed'] if checkpoint else 0
        
        logger.info(f"Starting import from page {start_page}")
        
        # Track overall progress
        start_time = datetime.now()
        page = start_page
        cards_batch = []
        
        try:
            while True:
                logger.info(f"📖 Fetching page {page}...")
                
                # Get cards from this page
                page_cards = self._fetch_page(page)
                
                if not page_cards:
                    logger.info("No more cards found. Import complete!")
                    break
                
                # Add to batch
                cards_batch.extend(page_cards)
                
                # Process batch when it reaches target size
                if len(cards_batch) >= self.batch_size:
                    processed_count = self._process_batch(cards_batch, skip_ai_effects)
                    total_processed += processed_count
                    
                    # Save checkpoint
                    last_card = cards_batch[-1]['name'] if cards_batch else 'Unknown'
                    self.save_checkpoint(page, total_processed, last_card)
                    
                    # Update database progress
                    self.db.update_import_progress(
                        processed=total_processed,
                        last_card=last_card
                    )
                    
                    # Clear batch
                    cards_batch = []
                    
                    # Show progress
                    elapsed = datetime.now() - start_time
                    rate = total_processed / elapsed.total_seconds() if elapsed.total_seconds() > 0 else 0
                    logger.info(f"📈 Progress: {total_processed:,} cards processed, {rate:.2f} cards/sec")
                
                page += 1
                
                # Rate limiting for Scryfall API
                time.sleep(self.request_delay)
            
            # Process any remaining cards
            if cards_batch:
                processed_count = self._process_batch(cards_batch, skip_ai_effects)
                total_processed += processed_count
            
            # Mark as complete
            self.db.update_import_progress(status='completed')
            
            # Clean up checkpoint
            if os.path.exists(self.checkpoint_file):
                os.remove(self.checkpoint_file)
            
            elapsed = datetime.now() - start_time
            logger.info(f"🎉 Full import completed!")
            logger.info(f"   Total cards processed: {total_processed:,}")
            logger.info(f"   Total time: {elapsed}")
            logger.info(f"   Average rate: {total_processed / elapsed.total_seconds():.2f} cards/sec")
            
        except KeyboardInterrupt:
            logger.info("🛑 Import interrupted by user")
            logger.info(f"Progress saved. Resume with: python full_import.py --resume")
        except Exception as e:
            logger.error(f"❌ Import failed: {e}")
            self.db.update_import_progress(status='failed', error=str(e))
    
    def _fetch_page(self, page: int):
        """Fetch a single page of cards from Scryfall"""
        try:
            import requests
            
            url = f"{self.base_url}/cards/search"
            params = {
                'q': 'game:paper -is:digital',
                'page': page,
                'format': 'json',
                'order': 'name'
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code == 404:
                return []  # No more pages
            elif response.status_code != 200:
                logger.error(f"API Error: {response.status_code}")
                return []
            
            data = response.json()
            raw_cards = data.get('data', [])
            
            # Process the raw card data
            return self._process_card_data(raw_cards)
            
        except Exception as e:
            logger.error(f"Error fetching page {page}: {e}")
            return []
    
    def _process_batch(self, cards, skip_ai_effects=False):
        """Process a batch of cards"""
        logger.info(f"🔄 Processing batch of {len(cards)} cards...")
        
        # Filter out existing cards
        new_cards = []
        for card in cards:
            if not self.db.card_exists(card['scryfall_id']):
                new_cards.append(card)
        
        if not new_cards:
            logger.info("All cards in batch already exist")
            return 0
        
        logger.info(f"Found {len(new_cards)} new cards to process")
        
        # Generate AI effects if not skipping
        if not skip_ai_effects:
            try:
                logger.info("🤖 Generating AI effects...")
                from ai_effects_generator import ai_generator
                enhanced_cards = ai_generator.generate_batch_effects(new_cards, delay=0.5)
            except Exception as e:
                logger.error(f"AI generation failed: {e}")
                enhanced_cards = new_cards
                # Add empty AI fields
                for card in enhanced_cards:
                    card.update({
                        'ai_generated_effects': [],
                        'ai_generated_abilities': [],
                        'ai_generated_keywords': [],
                        'ai_effect_description': 'AI generation failed',
                        'ai_strategic_value': 'Unknown',
                        'ai_combo_potential': 'Unknown'
                    })
        else:
            enhanced_cards = new_cards
            # Add empty AI fields
            for card in enhanced_cards:
                card.update({
                    'ai_generated_effects': [],
                    'ai_generated_abilities': [],
                    'ai_generated_keywords': [],
                    'ai_effect_description': 'AI generation skipped',
                    'ai_strategic_value': 'Unknown',
                    'ai_combo_potential': 'Unknown'
                })
        
        # Insert into database
        success_count = 0
        for card in enhanced_cards:
            if self.db.insert_card(card):
                success_count += 1
        
        logger.info(f"✅ Successfully inserted {success_count}/{len(enhanced_cards)} cards")
        return success_count

def main():
    parser = argparse.ArgumentParser(description='Import ALL cards from Scryfall with AI effects')
    parser.add_argument('--resume', action='store_true', help='Resume from checkpoint')
    parser.add_argument('--no-resume', action='store_true', help='Start fresh (ignore checkpoint)')
    parser.add_argument('--skip-ai', action='store_true', help='Skip AI effect generation (faster)')
    parser.add_argument('--estimate-only', action='store_true', help='Only show import estimates')
    
    args = parser.parse_args()
    
    # Create importer
    resume = not args.no_resume
    importer = FullScryfallImporter(resume_from_checkpoint=resume)
    
    if args.estimate_only:
        stats = importer.estimate_full_import_stats()
        if stats:
            print(f"📊 Full Scryfall Import Estimates:")
            print(f"   Total Cards: {stats['total_cards']:,}")
            print(f"   Estimated Cost: ${stats['estimated_cost_usd']}")
            print(f"   Estimated Time: {stats['estimated_time_hours']} hours ({stats['estimated_time_days']} days)")
            print(f"   Storage Required: ~{stats['storage_estimate_gb']} GB")
        return
    
    # Start full import
    importer.full_import_with_resume(skip_ai_effects=args.skip_ai)

if __name__ == "__main__":
    main()