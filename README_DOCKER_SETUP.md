# MTG Cards Database with AI-Generated Effects

This project creates a PostgreSQL database in Docker to store Magic: The Gathering cards fetched from the Scryfall API, enhanced with AI-generated effects based on your existing card effects system.

## Features

- **Docker PostgreSQL Database**: Containerized PostgreSQL with proper schema
- **Scryfall API Integration**: Fetches cards from the comprehensive Scryfall API
- **AI-Generated Effects**: Uses OpenAI to generate balanced effects for each card
- **Rich Card Data**: Stores complete card information including images, legalities, and prices
- **Progress Tracking**: Monitor import progress and statistics
- **Web Interface**: Adminer for database management
- **API Endpoints**: RESTful API to query the enhanced card database

## Setup Instructions

### 1. Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (for AI effect generation)
- Python 3.8+ (for running scripts)

### 2. Environment Setup

1. Copy the environment template:
```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start the Docker Containers

```bash
# Start PostgreSQL and Adminer
docker-compose up -d

# Check if containers are running
docker-compose ps
```

The following services will be available:
- **PostgreSQL**: `localhost:5432`
- **Adminer** (database UI): `http://localhost:8080`

### 4. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Import Cards with AI Effects

#### Option A: Quick Import (1000 cards)
```bash
cd backend
python scryfall_importer.py
```

#### Option B: Import Specific Sets
```bash
cd backend
python scryfall_importer.py --sets NEO MID VOW --max-cards 500
```

#### Option C: Custom Import
```bash
cd backend
python scryfall_importer.py --max-cards 2000 --batch-size 100
```

### 6. Start the Enhanced API Server

```bash
cd backend
python enhanced_app.py
```

The API will be available at `http://localhost:5001`

## Database Schema

### Cards Table
- **Basic Info**: name, mana_cost, cmc, type_line, oracle_text
- **Stats**: power, toughness, colors, rarity
- **Metadata**: set info, image URLs, prices, legalities
- **AI Generated**: effects, abilities, keywords, descriptions, strategic analysis

### Supporting Tables
- **import_progress**: Track import status
- **ai_generation_logs**: Log AI generation activity

## API Endpoints

### Card Queries
- `GET /api/cards` - Get cards with filtering
- `GET /api/cards/{scryfall_id}` - Get specific card details
- `GET /api/cards/search?q=name` - Search cards by name
- `GET /api/cards/effects` - Get cards with AI effects

### Database Info
- `GET /api/stats` - Database statistics
- `GET /api/sets` - Available sets
- `GET /api/cards/types` - Card types

### Import Management
- `GET /api/import/status` - Import progress
- `POST /api/import/start` - Start new import

## Example API Usage

### Search for Lightning Bolt variants
```bash
curl "http://localhost:5001/api/cards/search?q=lightning%20bolt"
```

### Get red creatures with AI effects
```bash
curl "http://localhost:5001/api/cards?type=creature&colors=R&limit=10"
```

### Get import statistics
```bash
curl "http://localhost:5001/api/stats"
```

## AI Effect Generation

The system generates balanced effects based on:

1. **Card Properties**: mana cost, colors, type, power/toughness
2. **Existing Text**: analyzes oracle text for themes
3. **Rarity**: adjusts power level based on rarity
4. **Color Identity**: adds appropriate keywords and effects

### Effect Types Generated
- **Spell Effects**: damage, draw, life gain, destruction, scry
- **Keywords**: flying, haste, trample, etc.
- **Activated Abilities**: tap abilities, mana abilities
- **Strategic Analysis**: combo potential, deck synergies

## Database Management

### Access Adminer
1. Go to `http://localhost:8080`
2. Login with:
   - **System**: PostgreSQL
   - **Server**: postgres
   - **Username**: mtg_user
   - **Password**: mtg_password
   - **Database**: mtg_cards

### Direct PostgreSQL Access
```bash
docker exec -it mtg_cards_db psql -U mtg_user -d mtg_cards
```

### Common Queries
```sql
-- Cards with AI effects
SELECT name, ai_effect_description 
FROM cards 
WHERE jsonb_array_length(ai_generated_effects) > 0;

-- Most powerful creatures
SELECT name, power, toughness, ai_strategic_value 
FROM cards 
WHERE type_line LIKE '%Creature%' 
ORDER BY CAST(power AS INTEGER) DESC LIMIT 10;

-- Import progress
SELECT * FROM import_progress;
```

## Configuration Options

### Environment Variables
- `MAX_CARDS_TO_IMPORT`: Maximum cards to import (default: 1000)
- `BATCH_SIZE`: Processing batch size (default: 100)
- `SCRYFALL_RATE_LIMIT`: API rate limit (default: 100)
- `OPENAI_API_KEY`: Required for AI effect generation

### Command Line Options
```bash
python scryfall_importer.py --help
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure Docker containers are running: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

2. **OpenAI API Errors**
   - Verify API key in `.env` file
   - Check OpenAI API quota and billing

3. **Import Stuck**
   - Check import status: `curl localhost:5001/api/import/status`
   - View logs: `tail -f card_import.log`

4. **Memory Issues**
   - Reduce batch size: `--batch-size 50`
   - Limit cards: `--max-cards 500`

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

## Integration with Frontend

The enhanced API is compatible with your existing frontend. Update the API base URL to use the new endpoints:

```typescript
// In your frontend service files
const API_BASE_URL = 'http://localhost:5001/api';

// Example: Get cards with AI effects
const cardsWithEffects = await fetch(`${API_BASE_URL}/cards/effects`);
```

## Performance Considerations

- **Indexing**: Database includes indexes on name, type, colors, rarity
- **Rate Limiting**: Respects Scryfall API limits (10 req/sec)
- **Batch Processing**: Processes cards in configurable batches
- **AI Throttling**: Configurable delay between AI requests

## Future Enhancements

- [ ] Advanced search with complex filters
- [ ] Card similarity recommendations
- [ ] Deck building with AI suggestions
- [ ] Export functionality
- [ ] Real-time import progress WebSocket
- [ ] Caching layer for frequent queries