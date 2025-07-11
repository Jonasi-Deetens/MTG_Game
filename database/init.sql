-- Create the cards table with AI-generated effects
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scryfall_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mana_cost VARCHAR(100),
    cmc INTEGER,
    type_line VARCHAR(255),
    oracle_text TEXT,
    power VARCHAR(10),
    toughness VARCHAR(10),
    colors JSONB,
    keywords JSONB,
    rarity VARCHAR(50),
    set_code VARCHAR(10),
    set_name VARCHAR(255),
    collector_number VARCHAR(20),
    image_url VARCHAR(500),
    prices JSONB,
    legalities JSONB,
    flavor_text TEXT,
    artist VARCHAR(255),
    -- AI Generated fields
    ai_generated_effects JSONB,
    ai_generated_abilities JSONB,
    ai_generated_keywords JSONB,
    ai_effect_description TEXT,
    ai_strategic_value TEXT,
    ai_combo_potential TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_scryfall_id ON cards(scryfall_id);
CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards(type_line);
CREATE INDEX IF NOT EXISTS idx_cards_colors ON cards USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);

-- Create a table for tracking import progress
CREATE TABLE IF NOT EXISTS import_progress (
    id SERIAL PRIMARY KEY,
    total_cards INTEGER DEFAULT 0,
    processed_cards INTEGER DEFAULT 0,
    failed_cards INTEGER DEFAULT 0,
    last_processed_card VARCHAR(255),
    status VARCHAR(50) DEFAULT 'idle',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Insert initial progress record
INSERT INTO import_progress (status) VALUES ('idle') ON CONFLICT DO NOTHING;

-- Create a table for storing AI generation logs
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id SERIAL PRIMARY KEY,
    card_id UUID REFERENCES cards(id),
    card_name VARCHAR(255),
    generation_type VARCHAR(50), -- 'effects', 'abilities', 'keywords', 'description'
    ai_response TEXT,
    generation_time INTERVAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();