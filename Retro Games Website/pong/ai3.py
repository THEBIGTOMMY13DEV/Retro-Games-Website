import random
import time

class PongAI:
    def __init__(self, difficulty):
        self.difficulty = difficulty
        self.speed = self.set_speed(difficulty)
        self.reaction_delay = self.set_reaction_delay(difficulty)
        self.move_counter = 0
        self.target_y = None
        self.last_y = None
        self.last_target = None
        self.smoothing_factor = 0.15
        self.prediction_error = 0
        self.momentum = 0  # Add momentum for smoother movement
        self.anticipation_offset = 0  # Add anticipation for more human-like prediction

    def set_speed(self, difficulty):
        speeds = {
            "easy": 4,
            "medium": 5,
            "hard": 8
        }
        return speeds.get(difficulty, 5)

    def set_reaction_delay(self, difficulty):
        delays = {
            "easy": 2,
            "medium": 1.5,
            "hard": 0.5
        }
        return delays.get(difficulty, 1.5)

    def move_paddle(self, paddle_y, puck_y, canvas_height):
        if self.last_y is None:
            self.last_y = paddle_y
            self.last_target = paddle_y
            self.prediction_error = random.uniform(-10, 10)
            self.momentum = 0
            self.anticipation_offset = 0

        # Update anticipation offset occasionally
        if random.random() < 0.02:
            self.anticipation_offset = random.uniform(-20, 20)

        # Calculate momentum (continues movement in the same direction)
        if self.last_target is not None:
            movement_direction = self.last_target - self.last_y
            self.momentum = self.momentum * 0.9 + movement_direction * 0.1

        # Update prediction error more smoothly
        if random.random() < 0.02:  # Reduced frequency of updates
            if self.difficulty == "hard":
                target_error = random.uniform(-5, 5)
            else:
                target_error = random.uniform(-15, 15)
            # Smooth transition to new error
            self.prediction_error = self.prediction_error * 0.7 + target_error * 0.3

        # Calculate base target position with anticipation
        base_target = puck_y + self.prediction_error + self.anticipation_offset

        # Add human-like delay and imperfection
        if self.difficulty == "hard":
            reaction_delay = 0.2
            max_error = 3
        elif self.difficulty == "medium":
            reaction_delay = 0.3
            max_error = 8
        else:
            reaction_delay = 0.4
            max_error = 15

        # Smooth movement towards target
        if self.last_target is not None:
            # Add momentum and reaction delay
            target = (base_target * (1 - reaction_delay) + 
                     self.last_target * reaction_delay + 
                     self.momentum * 0.2)
            
            # Add small random variations
            target += random.uniform(-max_error, max_error)
        else:
            target = base_target

        # Ensure paddle stays within bounds with some padding
        target = max(40, min(target, canvas_height - 40))

        # Calculate movement with variable speed
        distance = target - paddle_y
        
        # Add human-like acceleration and deceleration
        if abs(distance) > 100:
            # Fast movement for long distances
            self.smoothing_factor = min(0.15, abs(distance) / 800)
        else:
            # Slower, more precise movement for short distances
            self.smoothing_factor = max(0.05, abs(distance) / 1000)

        # Apply smoothing and speed
        movement = distance * self.smoothing_factor * self.speed

        # Add slight random variation to movement
        movement *= random.uniform(0.95, 1.05)

        # Calculate new position
        new_y = paddle_y + movement

        # Ensure paddle stays within canvas bounds
        new_y = max(0, min(new_y, canvas_height - 60))

        # Update last positions
        self.last_y = new_y
        self.last_target = target

        return new_y

if __name__ == "__main__":
    # Test the AI
    ai = PongAI("medium")
    paddle_y = 150
    puck_y = 100
    canvas_height = 300
    new_paddle_y = ai.move_paddle(paddle_y, puck_y, canvas_height)
    print(f"New paddle Y position: {new_paddle_y}")