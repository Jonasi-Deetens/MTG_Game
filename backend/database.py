import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL not provided")
        
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def get_connection(self):
        """Get a raw psycopg2 connection"""
        return psycopg2.connect(self.database_url)
    
    def get_session(self):
        """Get a SQLAlchemy session"""
        return self.SessionLocal()
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute a query and return results"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """Execute an update/insert query and return affected rows"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
    
    def card_exists(self, scryfall_id: str) -> bool:
        """Check if a card already exists in the database"""
        query = "SELECT COUNT(*) as count FROM cards WHERE scryfall_id = %s"
        result = self.execute_query(query, (scryfall_id,))
        return result[0]['count'] > 0
    
    def insert_card(self, card_data: Dict[str, Any]) -> bool:
        """Insert a card into the database"""
        try:
            query = """
                INSERT INTO cards (
                    scryfall_id, name, mana_cost, cmc, type_line, oracle_text,
                    power, toughness, colors, keywords, rarity, set_code, set_name,
                    collector_number, image_url, prices, legalities, flavor_text,
                    artist, ai_generated_effects, ai_generated_abilities,
                    ai_generated_keywords, ai_effect_description, ai_strategic_value,
                    ai_combo_potential
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params = (
                card_data.get('scryfall_id'),
                card_data.get('name'),
                card_data.get('mana_cost'),
                card_data.get('cmc'),
                card_data.get('type_line'),
                card_data.get('oracle_text'),
                card_data.get('power'),
                card_data.get('toughness'),
                Json(card_data.get('colors', [])),
                Json(card_data.get('keywords', [])),
                card_data.get('rarity'),
                card_data.get('set_code'),
                card_data.get('set_name'),
                card_data.get('collector_number'),
                card_data.get('image_url'),
                Json(card_data.get('prices', {})),
                Json(card_data.get('legalities', {})),
                card_data.get('flavor_text'),
                card_data.get('artist'),
                Json(card_data.get('ai_generated_effects', [])),
                Json(card_data.get('ai_generated_abilities', [])),
                Json(card_data.get('ai_generated_keywords', [])),
                card_data.get('ai_effect_description'),
                card_data.get('ai_strategic_value'),
                card_data.get('ai_combo_potential')
            )
            
            self.execute_update(query, params)
            return True
            
        except Exception as e:
            logger.error(f"Error inserting card {card_data.get('name')}: {str(e)}")
            return False
    
    def update_import_progress(self, total: int = None, processed: int = None, 
                            failed: int = None, last_card: str = None, 
                            status: str = None, error: str = None):
        """Update import progress"""
        updates = []
        params = []
        
        if total is not None:
            updates.append("total_cards = %s")
            params.append(total)
        if processed is not None:
            updates.append("processed_cards = %s")
            params.append(processed)
        if failed is not None:
            updates.append("failed_cards = %s")
            params.append(failed)
        if last_card is not None:
            updates.append("last_processed_card = %s")
            params.append(last_card)
        if status is not None:
            updates.append("status = %s")
            params.append(status)
            if status == 'running':
                updates.append("started_at = CURRENT_TIMESTAMP")
            elif status == 'completed':
                updates.append("completed_at = CURRENT_TIMESTAMP")
        if error is not None:
            updates.append("error_message = %s")
            params.append(error)
        
        if updates:
            query = f"UPDATE import_progress SET {', '.join(updates)} WHERE id = 1"
            self.execute_update(query, tuple(params))
    
    def get_import_progress(self) -> Dict[str, Any]:
        """Get current import progress"""
        query = "SELECT * FROM import_progress WHERE id = 1"
        result = self.execute_query(query)
        return result[0] if result else {}
    
    def log_ai_generation(self, card_id: str, card_name: str, generation_type: str, 
                         ai_response: str, generation_time: timedelta):
        """Log AI generation activity"""
        query = """
            INSERT INTO ai_generation_logs (card_id, card_name, generation_type, ai_response, generation_time)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (card_id, card_name, generation_type, ai_response, generation_time)
        self.execute_update(query, params)
    
    def get_cards_by_type(self, card_type: str, limit: int = 100) -> List[Dict]:
        """Get cards by type"""
        query = """
            SELECT * FROM cards 
            WHERE type_line ILIKE %s 
            ORDER BY name 
            LIMIT %s
        """
        return self.execute_query(query, (f'%{card_type}%', limit))
    
    def get_cards_with_ai_effects(self, limit: int = 100) -> List[Dict]:
        """Get cards that have AI-generated effects"""
        query = """
            SELECT * FROM cards 
            WHERE ai_generated_effects IS NOT NULL 
            AND jsonb_array_length(ai_generated_effects) > 0
            ORDER BY created_at DESC
            LIMIT %s
        """
        return self.execute_query(query, (limit,))
    
    def search_cards(self, name_query: str, limit: int = 20) -> List[Dict]:
        """Search cards by name"""
        query = """
            SELECT * FROM cards 
            WHERE name ILIKE %s 
            ORDER BY name 
            LIMIT %s
        """
        return self.execute_query(query, (f'%{name_query}%', limit))

# Global database instance
db = None

def get_db() -> DatabaseManager:
    """Get database instance"""
    global db
    if db is None:
        db = DatabaseManager()
    return db