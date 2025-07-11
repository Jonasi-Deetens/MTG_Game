# MTG AI Training Guide

This guide explains how to use the AI training system for Magic: The Gathering deck simulation.

## Overview

The AI training system uses reinforcement learning to teach AI agents how to play Magic: The Gathering. The AI learns by playing games against itself and receiving feedback based on game outcomes.

## Architecture

### Components

1. **MTGAIAgent** (`backend/app/ai/mtg_ai_agent.py`)

   - Core AI agent using Q-learning
   - Makes decisions based on game state
   - Learns from rewards and outcomes

2. **MTGGameSimulator** (`backend/app/ai/mtg_ai_agent.py`)

   - Simulates complete MTG games
   - Handles game state management
   - Records game history for training

3. **MTGAITrainer** (`backend/app/ai/trainer.py`)

   - Manages training sessions
   - Handles batch training and evaluation
   - Saves/loads AI progress

4. **Flask AI Routes** (`backend/app_modern.py`)

   - REST API endpoints for AI operations
   - Background training support
   - Real-time status updates

5. **Frontend Interface** (`frontend/src/components/AITrainingPanel.tsx`)
   - User interface for training control
   - Real-time progress monitoring
   - Game simulation interface

## Getting Started

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Application

```bash
# Start all services (recommended)
python start_ai_services.py

# Or start Flask backend separately
cd backend
python app_modern.py
```

### 3. Access the AI Training Interface

1. Open your browser to `http://localhost:3000`
2. Click "AI Training" on the landing page
3. Use the interface to start training and simulations

## Training Process

### How the AI Learns

1. **State Representation**: The AI converts game state into a simplified representation including:

   - Player and opponent life totals
   - Hand sizes
   - Battlefield presence
   - Turn number and phase
   - Current player

2. **Action Selection**: The AI can perform various actions:

   - Play lands
   - Cast spells
   - Attack with creatures
   - Activate abilities
   - Pass priority

3. **Reward System**: The AI receives rewards based on:

   - Life difference changes
   - Card advantage
   - Board presence
   - Win/loss conditions
   - Penalties for inefficient play

4. **Q-Learning**: The AI uses Q-learning to update its decision-making:
   - Q(s,a) = Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]
   - Where α is learning rate, γ is discount factor

### Training Parameters

- **Learning Rate**: How quickly the AI updates its knowledge (0.1 default)
- **Exploration Rate**: How often the AI tries random actions (0.2 default)
- **Batch Size**: Number of episodes per training batch (100 default)
- **Episodes**: Total number of games to play (100-1000+)

## Using the Interface

### Quick Start

1. **Quick Training**: Click "Train 100 Episodes" for a short training session
2. **Extended Training**: Click "Extended Training" for 1000 episodes
3. **Custom Training**: Modify parameters for specific needs

### Monitoring Progress

- **Win Rate**: Percentage of games won by the AI
- **Average Turns**: Average game length
- **Q-Table Size**: Number of learned state-action pairs
- **Training Progress**: Real-time progress bar

### Evaluation

- **Quick Evaluate**: Test AI performance on 20 games
- **Full Evaluate**: Comprehensive evaluation on 100 games
- **Results**: Win rate, draw rate, loss rate, and average turns

### Simulation

- **Quick Simulate**: Run a single AI vs AI game
- **Custom Simulation**: Specify decks and parameters
- **Results**: Winner, turns, final life totals, and action count

## AI Management

### Saving and Loading

- **Save AI State**: Preserve current training progress
- **Load AI State**: Restore previous training state
- **Reset AI**: Start fresh with untrained AI

### Performance Metrics

The AI tracks various metrics:

- Games played
- Win/loss/draw ratios
- Average game length
- Q-table size (knowledge base)
- Experience buffer size

## Advanced Features

### Experience Replay

The AI uses experience replay to improve learning:

- Stores game experiences in a buffer
- Randomly samples from buffer for training
- Helps prevent forgetting and improves stability

### Adaptive Learning

The AI adapts its learning based on performance:

- Reduces exploration rate over time
- Adjusts learning rate based on progress
- Maintains balance between exploration and exploitation

### Multi-Agent Training

The system supports training multiple AI agents:

- Self-play training (AI vs itself)
- Different strategies and deck types
- Comparative performance analysis

## Customization

### Modifying Rewards

You can customize the reward function in `MTGAIAgent.calculate_reward()`:

```python
def calculate_reward(self, game_state, action, next_game_state):
    reward = 0.0

    # Life difference reward
    life_diff = (next_game_state.player_life - next_game_state.opponent_life) - \
               (game_state.player_life - game_state.opponent_life)
    reward += life_diff * 2.0

    # Add custom rewards here
    # reward += custom_reward_calculation()

    return reward
```

### Adding New Actions

To add new action types:

1. Add to `ActionType` enum
2. Update `get_available_actions()` method
3. Implement action logic in `_apply_action()`
4. Update reward calculation if needed

### Custom Game Rules

Modify the game simulation in `MTGGameSimulator`:

- Add new card types and abilities
- Implement complex game mechanics
- Customize win conditions

## Troubleshooting

### Common Issues

1. **AI not learning**: Check learning rate and exploration rate
2. **Poor performance**: Increase training episodes
3. **Memory issues**: Reduce batch size or experience buffer
4. **Service not starting**: Check port availability (8000)

### Performance Tips

1. **Start small**: Begin with 100 episodes
2. **Monitor progress**: Watch win rate improvements
3. **Save frequently**: Preserve good training states
4. **Experiment**: Try different parameters

### Debugging

Enable debug logging by modifying the AI agent:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## API Reference

### Training Endpoints

- `POST /api/ai/train` - Start training session
- `GET /api/ai/training-status` - Get current training status
- `POST /api/ai/evaluate` - Evaluate AI performance
- `POST /api/ai/simulate` - Simulate a game

### Management Endpoints

- `GET /api/ai/progress` - Get learning progress
- `POST /api/ai/save` - Save AI state
- `POST /api/ai/load` - Load AI state
- `POST /api/ai/reset` - Reset AI
- `GET /api/ai/stats` - Get AI statistics

### Example API Usage

```bash
# Start training
curl -X POST http://localhost:8000/api/ai/train \
  -H "Content-Type: application/json" \
  -d '{"num_episodes": 100, "learning_rate": 0.1}'

# Check status
curl http://localhost:8000/api/ai/training-status

# Evaluate AI
curl -X POST http://localhost:8000/api/ai/evaluate \
  -H "Content-Type: application/json" \
  -d '{"num_games": 50}'
```

## Future Enhancements

### Planned Features

1. **Neural Networks**: Replace Q-learning with deep learning
2. **Card Recognition**: Better understanding of card abilities
3. **Strategy Learning**: Learn specific deck strategies
4. **Multiplayer Support**: Train with multiple players
5. **Tournament Mode**: AI tournament system

### Research Areas

1. **Meta-Learning**: Learn to learn new strategies quickly
2. **Transfer Learning**: Apply knowledge across different formats
3. **Adversarial Training**: Train against specific opponent types
4. **Explainable AI**: Understand AI decision-making

## Contributing

To contribute to the AI system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt
pip install pytest pytest-cov black flake8

# Run tests
pytest tests/

# Format code
black backend/app/ai/

# Lint code
flake8 backend/app/ai/
```

## License

This AI training system is part of the MTG Deck Simulator project and follows the same license terms.
