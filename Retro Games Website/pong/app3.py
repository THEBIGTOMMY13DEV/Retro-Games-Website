from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from ai3 import PongAI

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print("Client connected to server")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected from server")

@socketio.on('move_paddle')
def handle_move_paddle(data):
    print("Received move_paddle event:", data)
    try:
        paddle_y = float(data['paddle_y'])
        puck_y = float(data['puck_y'])
        difficulty = data.get('difficulty', 'medium')  # Default to medium if missing
        ai = PongAI(difficulty)  # Create AI instance
        new_paddle_y = ai.move_paddle(paddle_y, puck_y, 300)
        print(f"Emitting paddle_moved with new_y: {new_paddle_y}")
        emit('paddle_moved', {'new_paddle_y': new_paddle_y})
    except Exception as e:
        print(f"Error processing move_paddle: {e}")

if __name__ == '__main__':

    app.run(host='127.0.0.1', debug=True) 