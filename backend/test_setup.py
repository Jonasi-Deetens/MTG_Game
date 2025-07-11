#!/usr/bin/env python3
"""
Test script to validate the MTG card database setup
"""
import os
import sys
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test PostgreSQL database connection"""
    print("🔍 Testing database connection...")
    try:
        from database import get_db
        db = get_db()
        
        # Test basic query
        result = db.execute_query("SELECT version()")
        print(f"✅ Database connected: {result[0]['version'][:50]}...")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_openai_api():
    """Test OpenAI API key"""
    print("\n🔍 Testing OpenAI API key...")
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key or api_key == 'your_openai_api_key_here':
        print("❌ OpenAI API key not configured in .env file")
        return False
    
    # Test a simple API call
    try:
        import openai
        openai.api_key = api_key
        
        # Make a minimal test request
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Say 'API test successful'"}],
            max_tokens=10
        )
        
        if "API test successful" in response.choices[0].message.content:
            print("✅ OpenAI API key is valid")
            return True
        else:
            print("⚠️  OpenAI API responded but with unexpected content")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI API test failed: {str(e)}")
        return False

def test_scryfall_api():
    """Test Scryfall API connection"""
    print("\n🔍 Testing Scryfall API connection...")
    try:
        response = requests.get("https://api.scryfall.com/cards/named?exact=Lightning Bolt")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Scryfall API working: Found '{data['name']}'")
            return True
        else:
            print(f"❌ Scryfall API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Scryfall API test failed: {str(e)}")
        return False

def test_database_schema():
    """Test if database schema is properly initialized"""
    print("\n🔍 Testing database schema...")
    try:
        from database import get_db
        db = get_db()
        
        # Check if main tables exist
        tables = [
            "cards",
            "import_progress", 
            "ai_generation_logs"
        ]
        
        for table in tables:
            result = db.execute_query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = %s",
                (table,)
            )
            
            if result[0]['count'] == 0:
                print(f"❌ Table '{table}' not found")
                return False
        
        print("✅ Database schema is properly initialized")
        return True
        
    except Exception as e:
        print(f"❌ Database schema test failed: {str(e)}")
        return False

def test_ai_effect_generation():
    """Test AI effect generation with a sample card"""
    print("\n🔍 Testing AI effect generation...")
    try:
        from ai_effects_generator import ai_generator
        
        # Sample card data
        sample_card = {
            'name': 'Lightning Bolt',
            'mana_cost': '{R}',
            'cmc': 1,
            'type_line': 'Instant',
            'oracle_text': 'Lightning Bolt deals 3 damage to any target.',
            'colors': ['R'],
            'rarity': 'common'
        }
        
        print("   Generating effects for Lightning Bolt...")
        effects = ai_generator.generate_card_effects(sample_card)
        
        if effects and 'spell_effects' in effects:
            print(f"✅ AI effect generation working: Generated {len(effects.get('spell_effects', []))} effects")
            print(f"   Sample effect: {effects.get('ai_effect_description', 'No description')[:50]}...")
            return True
        else:
            print("❌ AI effect generation failed: No effects returned")
            return False
            
    except Exception as e:
        print(f"❌ AI effect generation test failed: {str(e)}")
        return False

def test_sample_import():
    """Test importing a few sample cards"""
    print("\n🔍 Testing sample card import...")
    try:
        from scryfall_importer import ScryfallImporter
        importer = ScryfallImporter()
        
        # Temporarily override max cards for testing
        original_max = importer.max_cards
        importer.max_cards = 5
        
        print("   Fetching 5 sample cards...")
        cards = importer.fetch_all_cards()
        
        if len(cards) > 0:
            print(f"✅ Sample import working: Fetched {len(cards)} cards")
            print(f"   Sample card: {cards[0]['name']}")
            
            # Test one card with AI effects
            print("   Testing AI enhancement...")
            from ai_effects_generator import ai_generator
            enhanced = ai_generator.generate_batch_effects([cards[0]], delay=0)
            
            if enhanced and len(enhanced) > 0:
                print("✅ AI enhancement working")
                return True
            else:
                print("❌ AI enhancement failed")
                return False
        else:
            print("❌ Sample import failed: No cards fetched")
            return False
            
    except Exception as e:
        print(f"❌ Sample import test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and provide a summary"""
    print("🚀 Starting MTG Card Database Setup Tests\n")
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Database Schema", test_database_schema),
        ("OpenAI API", test_openai_api),
        ("Scryfall API", test_scryfall_api),
        ("AI Effect Generation", test_ai_effect_generation),
        ("Sample Import", test_sample_import),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<8} {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your setup is ready.")
        print("\nNext steps:")
        print("1. Run 'python scryfall_importer.py --max-cards 100' to import some cards")
        print("2. Run 'python enhanced_app.py' to start the API server")
        print("3. Visit http://localhost:8080 for database management")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
        print("\nCommon solutions:")
        print("- Ensure Docker containers are running: 'docker-compose up -d'")
        print("- Check your .env file has a valid OPENAI_API_KEY")
        print("- Make sure all Python dependencies are installed")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)