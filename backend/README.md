# MTG Deck Manager Backend

A Flask-based backend for managing Magic: The Gathering decks using TinyDB for storage and mtgsdk for card data.

## Features

- Create, read, update, and delete MTG decks
- Upload deck lists from text files
- Automatic card data fetching using mtgsdk
- Commander selection for legendary creatures
- Deck statistics and analysis
- RESTful API endpoints

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask application:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Decks

- `GET /api/decks` - Get all decks
- `POST /api/decks` - Create a new deck
- `GET /api/decks/<id>` - Get a specific deck
- `PUT /api/decks/<id>` - Update a deck
- `DELETE /api/decks/<id>` - Delete a deck

### Cards

- `GET /api/cards/search?q=<query>` - Search for cards by name

## Deck Format

When creating a deck, send a JSON payload with the following structure:

```json
{
  "name": "Deck Name",
  "description": "Optional description",
  "commander_id": "optional-commander-card-id",
  "deck_list": [
    {
      "quantity": 2,
      "name": "Island"
    },
    {
      "quantity": 1,
      "name": "Lightning Bolt"
    }
  ]
}
```

## Text File Format

Upload a `.txt` file with one card per line in the format:
```
2 Island
1 Lightning Bolt
3 Mountain
1 Elesh Norn, Grand Cenobite
```

## Data Storage

The application uses TinyDB to store deck data in a JSON file (`decks.json`). Each deck contains:

- Basic deck information (name, description, commander)
- Full card data from mtgsdk
- Legendary creatures for commander selection
- Creation and update timestamps

## Dependencies

- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- TinyDB - Lightweight database
- mtgsdk - Magic: The Gathering API wrapper
- python-dotenv - Environment variable management 