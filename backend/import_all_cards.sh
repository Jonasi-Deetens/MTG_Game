#!/bin/bash

# MTG Full Import Script
# Various options for importing cards from Scryfall

echo "🃏 MTG Cards Import Options"
echo "=========================="
echo ""
echo "Choose an import option:"
echo "1. Quick import (1,000 cards with AI effects)"
echo "2. Medium import (10,000 cards with AI effects)"
echo "3. Full import (ALL cards with AI effects) - EXPENSIVE!"
echo "4. Full import without AI effects (faster)"
echo "5. Estimate full import costs only"
echo "6. Resume previous import"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🚀 Starting quick import..."
        python scryfall_importer.py --max-cards 1000
        ;;
    2)
        echo "🚀 Starting medium import..."
        python scryfall_importer.py --max-cards 10000
        ;;
    3)
        echo "⚠️  Starting FULL import with AI effects..."
        echo "This will take days and cost hundreds of dollars!"
        read -p "Are you sure? (y/N): " confirm
        if [ "$confirm" = "y" ]; then
            python full_import.py
        else
            echo "Cancelled."
        fi
        ;;
    4)
        echo "🚀 Starting full import without AI effects..."
        python full_import.py --skip-ai
        ;;
    5)
        echo "📊 Estimating full import costs..."
        python full_import.py --estimate-only
        ;;
    6)
        echo "🔄 Resuming previous import..."
        python full_import.py --resume
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac