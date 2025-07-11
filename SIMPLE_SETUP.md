# Simple MTG Card Database Setup

This is the streamlined approach you requested:

1. **Read all cards from Scryfall** 
2. **Generate AI effects** for each card
3. **Save to PostgreSQL database**
4. **Frontend gets everything from the database**

## 🚀 Quick Setup

### 1. Start the Database
```bash
# Start PostgreSQL + Adminer
docker-compose up -d
```

### 2. Set Up Environment
```bash
# Copy and edit environment file
cp backend/.env.example backend/.env

# Edit backend/.env and add your OpenAI API key:
# OPENAI_API_KEY=your_actual_key_here
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Import Cards (Choose One)

**Test with 100 cards:**
```bash
python import_cards.py --limit 100
```

**Test with 1000 cards:**
```bash
python import_cards.py --limit 1000
```

**Import ALL cards (expensive, ~$200-500):**
```bash
python import_cards.py
```

**Import all cards WITHOUT AI (fast, cheap):**
```bash
python import_cards.py --skip-ai
```

### 5. Start Your API Server
```bash
python app.py
```

## ✅ What You Get

Your existing `app.py` now works with PostgreSQL instead of JSON files:

- **All cards** from Scryfall stored in database
- **AI-generated effects** for each card (matching your cardEffects.ts format)
- **Same API endpoints** your frontend already uses
- **Enhanced card data** with AI effects included

## 🎯 Frontend Integration

Your frontend continues to work exactly as before, but now gets enhanced data:

```typescript
// Your existing code still works
const cards = await api.searchCards('lightning bolt');

// But now cards include AI-generated effects
cards.forEach(card => {
  console.log(card.name);
  console.log(card.ai_generated_effects);    // AI effects
  console.log(card.ai_generated_keywords);   // AI keywords
  console.log(card.ai_effect_description);   // AI analysis
});

// New database queries available
const allCards = await api.getCards({
  type: 'creature',
  colors: 'R',
  limit: 20
});
```

## 🔄 What Changed

**Before:**
- Cards fetched from mtgsdk/Scryfall API on demand
- Effects defined in cardEffects.ts
- Deck data stored in JSON

**After:**
- All cards pre-loaded in PostgreSQL database
- AI effects generated and stored for each card
- Enhanced API with filtering and search
- Same frontend code, better data

## 📊 Database Contents

After import, your database contains:

- **~100,000 MTG cards** with complete metadata
- **AI-generated effects** for each card
- **Strategic analysis** and combo potential
- **All original Scryfall data** (images, prices, legalities)

## 🎮 Example Usage

```bash
# Test the setup
cd backend
python test_setup.py

# Import 1000 cards with AI effects
python import_cards.py --limit 1000

# Start your API
python app.py

# Your frontend now gets all data from database!
```

This approach gives you a **complete MTG database** with AI-enhanced effects while keeping your existing frontend code working perfectly! 🎉