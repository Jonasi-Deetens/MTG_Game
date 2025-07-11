#!/usr/bin/env python3
"""
Quick script to generate all MTG card names from Scryfall

Usage: python quick_generate_names.py
Output: mtg_card_names.txt
"""

import requests
import time

def main():
    print("🔍 Fetching all MTG card names from Scryfall...")
    
    unique_names = set()
    page = 1
    
    while True:
        print(f"   Page {page}...", end=" ")
        
        response = requests.get("https://api.scryfall.com/cards/search", params={
            'q': 'game:paper -is:digital',
            'page': page,
            'format': 'json',
            'order': 'name'
        })
        
        if response.status_code == 404:
            print("Done!")
            break
        elif response.status_code != 200:
            print(f"Error: {response.status_code}")
            break
        
        data = response.json()
        cards = data.get('data', [])
        
        if not cards:
            print("No cards found")
            break
        
        # Extract names
        for card in cards:
            name = card.get('name')
            if name:
                # Handle double-faced cards
                if ' // ' in name:
                    name = name.split(' // ')[0]
                unique_names.add(name)
        
        print(f"{len(cards)} cards, {len(unique_names)} total unique names")
        
        if not data.get('has_more', False):
            break
        
        page += 1
        time.sleep(0.1)  # Rate limiting
    
    # Save to file
    print(f"💾 Saving {len(unique_names)} unique names to mtg_card_names.txt...")
    
    with open('mtg_card_names.txt', 'w', encoding='utf-8') as f:
        f.write(f"# MTG Card Names - {len(unique_names)} unique cards\n")
        f.write(f"# Generated from Scryfall API\n\n")
        
        for name in sorted(unique_names, key=str.lower):
            f.write(f"{name}\n")
    
    print(f"✅ Done! {len(unique_names)} card names saved to mtg_card_names.txt")

if __name__ == "__main__":
    main()