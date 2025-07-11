#!/bin/bash

# MTG Cards Database Quick Start Script
# This script sets up the entire Docker + PostgreSQL + AI effects system

set -e  # Exit on any error

echo "🚀 MTG Cards Database with AI Effects - Quick Start"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your OpenAI API key!"
    echo "   OPENAI_API_KEY=your_actual_api_key_here"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose down > /dev/null 2>&1 || true  # Stop any existing containers
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo "✅ Docker containers are running"
echo "   - PostgreSQL: localhost:5432"
echo "   - Adminer (DB UI): http://localhost:8080"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Python not found. Please install Python 3.8+ and try again."
    exit 1
fi

$PYTHON_CMD -m pip install -r requirements.txt > /dev/null

echo "✅ Python dependencies installed"

# Run setup tests
echo "🧪 Running setup tests..."
if $PYTHON_CMD test_setup.py; then
    echo ""
    echo "🎉 Setup complete! Everything is working."
    echo ""
    echo "💡 What you can do now:"
    echo "   1. Import some cards:"
    echo "      cd backend && python scryfall_importer.py --max-cards 100"
    echo ""
    echo "   2. Start the API server:"
    echo "      cd backend && python enhanced_app.py"
    echo ""
    echo "   3. Browse the database:"
    echo "      Open http://localhost:8080 in your browser"
    echo "      Login: postgres / mtg_user / mtg_password / mtg_cards"
    echo ""
    echo "   4. Test the API:"
    echo "      curl http://localhost:5001/api/stats"
    echo ""
else
    echo ""
    echo "❌ Setup tests failed. Please check the errors above."
    echo "💡 Common fixes:"
    echo "   - Make sure you set OPENAI_API_KEY in backend/.env"
    echo "   - Check Docker containers: docker-compose ps"
    echo "   - View logs: docker-compose logs postgres"
fi

cd ..
echo ""
echo "📚 For detailed instructions, see README_DOCKER_SETUP.md"