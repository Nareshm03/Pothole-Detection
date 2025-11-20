from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import os
from datetime import datetime
import logging
import threading

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/*": {
    "origins": ["*"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})

# Global variables for model management
model_manager = None
model = None

# Background initialization flag
initializing = False

def init_model_manager():
    """Initialize model manager in background"""
    global model_manager, model, initializing
    try:
        logger.info("Starting background model initialization...")
        
        # Import model manager only when needed
        from model_manager import ModelManager
        
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "pothole_best.pt")
        if not os.path.exists(model_path):
            model_path = 'yolov8n.pt'
        
        # Disable warmup to prevent blocking
        os.environ['MODEL_WARMUP'] = '0'
        
        model_manager = ModelManager(model_path, warmup_enabled=False)
        model = None  # Will be loaded on first inference
        initializing = False
        logger.info("Model manager initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize model manager: {e}")
        model_manager = None
        initializing = False

@app.route('/')
def index():
    logger.info("Serving index.html")
    return send_from_directory('.', 'index.html')

@app.route('/status')
def status():
    """Check server status"""
    return jsonify({
        'status': 'running',
        'model_loaded': model_manager is not None,
        'initializing': initializing,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/detect', methods=['POST'])
def detect():
    """Image detection endpoint"""
    global model_manager, model
    
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Initialize model if needed
        if model_manager is None:
            from model_manager import ModelManager
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "pothole_best.pt")
            if not os.path.exists(model_path):
                logger.warning(f"Pothole model not found at {model_path}, using yolov8n.pt")
                model_path = 'yolov8n.pt'
            else:
                logger.info(f"Using pothole model: {model_path}")
            model_manager = ModelManager(model_path, warmup_enabled=False)
        
        # Decode base64 image
        import base64
        import cv2
        import numpy as np
        
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Run detection
        model = model_manager.get_model()
        logger.info(f"Running detection on image shape: {img.shape}")
        results = model(img, conf=0.1, iou=0.45, verbose=False)
        logger.info(f"Detection complete, results: {len(results) if results else 0}")
        
        # Format detections (OBB model)
        detections = []
        if results and len(results) > 0:
            for result in results:
                if result.obb is not None and len(result.obb) > 0:
                    obb = result.obb
                    for i in range(len(obb)):
                        box = obb.xyxy[i].cpu().numpy()
                        conf = float(obb.conf[i].cpu().numpy())
                        x, y, x2, y2 = box
                        w, h = x2 - x, y2 - y
                        
                        severity = 'high' if conf > 0.7 else 'medium' if conf > 0.5 else 'low'
                        
                        detections.append({
                            'bbox': [float(x), float(y), float(w), float(h)],
                            'confidence': float(conf),
                            'class': 'pothole',
                            'severity': severity,
                            'area': int(w * h)
                        })
        
        logger.info(f"Returning {len(detections)} detections")
        return jsonify({
            'detections': detections,
            'count': len(detections)
        })
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/detection.html')
def detection():
    return send_from_directory('.', 'detection.html')

@app.route('/municipality.html')
def municipality():
    return send_from_directory('.', 'municipality.html')

@app.route('/analysis.html')
def analysis():
    return send_from_directory('.', 'analysis.html')

@app.route('/export', methods=['POST'])
def export_results():
    """Export detection results"""
    try:
        data = request.get_json()
        detections = data.get('detections', [])
        gps = data.get('gps', {})
        
        export_data = {
            'timestamp': datetime.now().isoformat(),
            'location': {
                'latitude': gps.get('lat', 0),
                'longitude': gps.get('lng', 0)
            },
            'detections': detections
        }
        
        return jsonify(export_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate_heatmap', methods=['POST'])
def generate_heatmap():
    """Generate heatmap from detections"""
    try:
        data = request.get_json()
        detections = data.get('detections', [])
        width = data.get('width', 640)
        height = data.get('height', 480)
        
        import cv2
        import numpy as np
        
        # Create heatmap
        heatmap = np.zeros((height, width), dtype=np.float32)
        
        for det in detections:
            x, y, w, h = det['bbox']
            conf = det['confidence']
            
            # Add gaussian blur around detection
            cx, cy = int(x + w/2), int(y + h/2)
            radius = int(max(w, h))
            
            y1, y2 = max(0, cy-radius), min(height, cy+radius)
            x1, x2 = max(0, cx-radius), min(width, cx+radius)
            
            if y2 > y1 and x2 > x1:
                heatmap[y1:y2, x1:x2] += conf
        
        # Normalize and colorize
        heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)
        heatmap = heatmap.astype(np.uint8)
        heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        # Encode to base64
        import base64
        _, buffer = cv2.imencode('.png', heatmap_color)
        heatmap_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Calculate stats
        high_severity = sum(1 for d in detections if d['confidence'] > 0.7)
        medium_severity = sum(1 for d in detections if 0.5 < d['confidence'] <= 0.7)
        low_severity = sum(1 for d in detections if d['confidence'] <= 0.5)
        avg_conf = sum(d['confidence'] for d in detections) / len(detections) if detections else 0
        
        return jsonify({
            'heatmap': f'data:image/png;base64,{heatmap_b64}',
            'stats': {
                'high_severity': high_severity,
                'medium_severity': medium_severity,
                'low_severity': low_severity,
                'avg_confidence': avg_conf
            }
        })
    except Exception as e:
        logger.error(f"Heatmap error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/video_feed')
def video_feed():
    """Video streaming route - return error if model not ready"""
    if model_manager is None:
        logger.warning("Model manager not ready, returning error frame")
        def error_frames():
            import cv2
            import numpy as np
            error_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(error_frame, "Model Loading...", (150, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            ret, buffer = cv2.imencode('.jpg', error_frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        return Response(error_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
    
    # Import video processing only when model is ready
    from app import generate_frames
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_frames():
    """Generate frames with pothole detection"""
    import cv2
    import numpy as np
    
    camera = cv2.VideoCapture(0)
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        try:
            if model_manager is not None:
                # Process frame with model
                model = model_manager.get_model()
                results = model(frame, conf=0.1, verbose=False)
                processed_frame = frame.copy()
                for result in results:
                    if result.obb is not None and len(result.obb) > 0:
                        obb = result.obb
                        for i in range(len(obb)):
                            box = obb.xyxy[i].cpu().numpy()
                            x1, y1, x2, y2 = map(int, box)
                            cv2.rectangle(processed_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            else:
                # Display "Model Loading..." message
                cv2.putText(frame, "Model Loading...", (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
                processed_frame = frame
            
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            # Display error message on frame
            cv2.putText(frame, f"Error: {str(e)[:50]}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    camera.release()

def downloadResult():
    """Placeholder for download functionality"""
    pass

if __name__ == '__main__':
    logger.info("Starting minimal server...")
    
    # Start background model initialization
    initializing = True
    threading.Thread(target=init_model_manager, daemon=True).start()
    
    # Get port from environment (for Render deployment)
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0'  # Allow external connections
    
    logger.info(f"Server starting on {host}:{port} with lazy model loading...")
    app.run(host=host, port=port, debug=False, threaded=True)