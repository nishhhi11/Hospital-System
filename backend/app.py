import subprocess
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_PATH = os.path.join(BASE_DIR, "engine")

def run_engine(command, args=[]):
    try:
        result = subprocess.run([ENGINE_PATH, command] + args, capture_output=True, text=True, cwd=BASE_DIR)
        if result.returncode != 0:
            return {"error": result.stderr}
        if not result.stdout.strip():
            return {"error": "Engine returned empty output"}
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": str(e)}

def notify_clients():
    socketio.emit('data_changed', {'timestamp': time.time()})

@app.route('/api/patients', methods=['GET'])
def get_patients():
    patients = run_engine("triage")
    return jsonify(patients)

@app.route('/api/patients', methods=['POST'])
def add_patient():
    data = request.json
    args = [
        data.get('id', f"P{int(time.time())}"),
        data.get('name', 'Unknown'),
        str(data.get('age', 0)),
        data.get('gender', 'M'),
        data.get('severity', 'Stable'),
        data.get('arrival_time', '00:00')
    ]
    result = run_engine("add", args)
    notify_clients()
    return jsonify(result)

@app.route('/api/patients/<id>', methods=['GET'])
def get_patient(id):
    patient = run_engine("get", [id])
    if "error" in patient:
        return jsonify(patient), 404
    return jsonify(patient)

@app.route('/api/patients/<id>', methods=['DELETE'])
def delete_patient(id):
    result = run_engine("delete", [id])
    notify_clients()
    return jsonify(result)

@app.route('/api/patients/<id>/severity', methods=['PATCH'])
def update_severity(id):
    data = request.json
    result = run_engine("update_severity", [id, data['severity']])
    notify_clients()
    return jsonify(result)

@app.route('/api/dsa/priority-queue', methods=['GET'])
def get_priority_queue():
    # Use the new 'heap' command for the raw array visualization
    heap = run_engine("heap")
    return jsonify(heap)

@app.route('/api/beds', methods=['GET'])
def get_beds():
    beds = run_engine("beds")
    return jsonify(beds)

@app.route('/api/beds/assign', methods=['POST'])
def assign_bed():
    data = request.json
    result = run_engine("assign_bed", [data['patientId'], data['bedId']])
    notify_clients()
    return jsonify(result)

@app.route('/api/beds/discharge', methods=['POST'])
def discharge_bed():
    data = request.json
    result = run_engine("discharge_bed", [data['bedId']])
    notify_clients()
    return jsonify(result)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = run_engine("alerts")
    return jsonify(alerts)

@app.route('/api/dsa/avl', methods=['GET'])
def get_avl():
    tree = run_engine("avl")
    return jsonify(tree)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@app.route('/api/undo', methods=['POST'])
def api_undo():
    res = run_engine("undo")
    if isinstance(res, dict) and "error" not in res:
        socketio.emit('data_changed', {'event': 'undo'})
    return jsonify(res)

@app.route('/api/dsa/stack', methods=['GET'])
def api_get_stack():
    return jsonify(run_engine("stack"))

# --- SMART MEDICAL EVENT SCHEDULING ---

@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(run_engine("get_events"))

@app.route('/api/events', methods=['POST'])
def add_event():
    data = request.json
    args = [
        data.get('id', f"E{int(time.time()*1000)}"),
        data.get('patient_id', ''),
        data.get('patient_name', ''),
        data.get('type', ''),
        data.get('title', ''),
        data.get('date', ''),
        data.get('time', ''),
        data.get('priority', 'Stable'),
        data.get('department', 'General'),
        data.get('doctor', 'Unassigned'),
        data.get('status', 'Upcoming')
    ]
    result = run_engine("add_event", args)
    notify_clients()
    return jsonify(result)

@app.route('/api/events/<id>', methods=['PATCH'])
def update_event_status(id):
    data = request.json
    result = run_engine("update_event_status", [id, data.get('status', 'Completed')])
    notify_clients()
    return jsonify(result)

@app.route('/api/events/<id>', methods=['DELETE'])
def delete_event(id):
    result = run_engine("delete_event", [id])
    notify_clients()
    return jsonify(result)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
