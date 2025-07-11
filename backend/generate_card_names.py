#!/usr/bin/env python3
"""
Generate a list of all unique MTG card names from Scryfall API

This script fetches all cards from Scryfall and creates a text file
with all unique card names, one per line.

Usage:
    python generate_card_names.py
    python generate_card_names.py --output custom_names.txt
    python generate_card_names.py --format json  # Save as JSON instead
"""

import requests
import time
import json
import argparse
from datetime import datetime

def log(message):
    """Simple logging with timestamp"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def fetch_all_card_names():
    """
    Fetch all unique card names from Scryfall API
    Returns a set of unique card names
    """
    log("🔍 Fetching all card names from Scryfall API...")
    
    base_url = "https://api.scryfall.com"
    unique_names = set()
    page = 1
    
    while True:
        log(f"   Fetching page {page}...")
        
        # Query all paper cards (excludes digital-only cards)
        url = f"{base_url}/cards/search"
        params = {
            'q': 'game:paper -is:digital',  # Only paper cards
            'page': page,
            'format': 'json',
            'order': 'name'
        }
        
        try:
            response = requests.get(url, params=params)
            
            if response.status_code == 404:
                log("   No more pages found")
                break
            elif response.status_code != 200:
                log(f"❌ API Error: {response.status_code} - {response.text}")
                break
            
            data = response.json()
            page_cards = data.get('data', [])
            
            if not page_cards:
                log("   No cards found on this page")
                break
            
            # Extract card names from this page
            page_names = set()
            for card in page_cards:
                name = card.get('name')
                if name:
                    # Handle double-faced cards - use the main name
                    if ' // ' in name:
                        # For double-faced cards, use the front face name
                        name = name.split(' // ')[0]
                    unique_names.add(name)
                    page_names.add(name)
            
            log(f"   Got {len(page_names)} unique names from this page. Total: {len(unique_names)}")
            
            # Check if there are more pages
            if not data.get('has_more', False):
                log("   Reached end of results")
                break
            
            page += 1
            
            # Rate limiting - Scryfall allows 10 requests per second
            time.sleep(0.1)
            
        except requests.RequestException as e:
            log(f"❌ Request failed: {str(e)}")
            break
        except json.JSONDecodeError as e:
            log(f"❌ JSON decode error: {str(e)}")
            break
        except Exception as e:
            log(f"❌ Unexpected error: {str(e)}")
            break
    
    log(f"✅ Fetched {len(unique_names)} unique card names")
    return unique_names

def save_names_to_txt(names, filename):
    """Save card names to a text file, one per line"""
    log(f"💾 Saving {len(names)} card names to {filename}...")
    
    try:
        # Sort names alphabetically for better organization
        sorted_names = sorted(names, key=str.lower)
        
        with open(filename, 'w', encoding='utf-8') as f:
            # Write header comment
            f.write(f"# MTG Card Names\n")
            f.write(f"# Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# Total unique cards: {len(sorted_names)}\n")
            f.write(f"# Source: Scryfall API (paper cards only)\n")
            f.write(f"\n")
            
            # Write all card names
            for name in sorted_names:
                f.write(f"{name}\n")
        
        log(f"✅ Successfully saved card names to {filename}")
        return True
        
    except Exception as e:
        log(f"❌ Error saving to file: {str(e)}")
        return False

def save_names_to_json(names, filename):
    """Save card names to a JSON file"""
    log(f"💾 Saving {len(names)} card names to {filename}...")
    
    try:
        # Sort names alphabetically
        sorted_names = sorted(names, key=str.lower)
        
        data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_cards": len(sorted_names),
                "source": "Scryfall API (paper cards only)",
                "description": "All unique MTG card names"
            },
            "card_names": sorted_names
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        log(f"✅ Successfully saved card names to {filename}")
        return True
        
    except Exception as e:
        log(f"❌ Error saving to JSON file: {str(e)}")
        return False

def generate_sample_stats(names):
    """Generate some interesting statistics about the card names"""
    log("📊 Generating statistics...")
    
    # Basic stats
    total_cards = len(names)
    
    # Letter distribution
    first_letters = {}
    for name in names:
        if name:
            first_letter = name[0].upper()
            first_letters[first_letter] = first_letters.get(first_letter, 0) + 1
    
    # Length distribution
    lengths = [len(name) for name in names if name]
    avg_length = sum(lengths) / len(lengths) if lengths else 0
    max_length = max(lengths) if lengths else 0
    min_length = min(lengths) if lengths else 0
    
    # Find longest and shortest names
    longest_names = [name for name in names if len(name) == max_length]
    shortest_names = [name for name in names if len(name) == min_length]
    
    log(f"📈 Card Name Statistics:")
    log(f"   Total unique cards: {total_cards:,}")
    log(f"   Average name length: {avg_length:.1f} characters")
    log(f"   Longest name: {max_length} chars - {longest_names[0] if longest_names else 'N/A'}")
    log(f"   Shortest name: {min_length} chars - {shortest_names[0] if shortest_names else 'N/A'}")
    log(f"   Most common first letter: {max(first_letters, key=first_letters.get)} ({first_letters[max(first_letters, key=first_letters.get)]} cards)")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Generate a list of all unique MTG card names from Scryfall')
    parser.add_argument('--output', '-o', default='mtg_card_names.txt', 
                       help='Output filename (default: mtg_card_names.txt)')
    parser.add_argument('--format', choices=['txt', 'json'], default='txt',
                       help='Output format: txt or json (default: txt)')
    parser.add_argument('--stats', action='store_true',
                       help='Show statistics about card names')
    
    args = parser.parse_args()
    
    log("🚀 Starting MTG card name generation...")
    
    # Fetch all card names
    card_names = fetch_all_card_names()
    
    if not card_names:
        log("❌ No card names found")
        return
    
    # Show statistics if requested
    if args.stats:
        generate_sample_stats(card_names)
    
    # Save to file
    if args.format == 'json':
        # Ensure .json extension
        output_file = args.output
        if not output_file.endswith('.json'):
            output_file = output_file.rsplit('.', 1)[0] + '.json'
        success = save_names_to_json(card_names, output_file)
    else:
        # Ensure .txt extension
        output_file = args.output
        if not output_file.endswith('.txt'):
            output_file = output_file.rsplit('.', 1)[0] + '.txt'
        success = save_names_to_txt(card_names, output_file)
    
    if success:
        log(f"🎉 Done! Card names saved to {output_file}")
        log(f"   Found {len(card_names):,} unique card names")
        
        # Show a few examples
        sample_names = sorted(list(card_names))[:5]
        log(f"   Sample names: {', '.join(sample_names)}...")
        
    else:
        log("❌ Failed to save card names")

if __name__ == "__main__":
    main()