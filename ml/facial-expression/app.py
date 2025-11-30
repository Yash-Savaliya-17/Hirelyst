import os
import uuid
import cv2
import time
import boto3
import logging
import numpy as np
import mediapipe as mp
from collections import deque
from dotenv import load_dotenv
from urllib.parse import urlparse
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from botocore.exceptions import NoCredentialsError, ClientError

load_dotenv()

app = Flask(__name__)

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Storage configuration (MinIO or AWS S3)
USE_MINIO = os.getenv('USE_MINIO', 'true').lower() == 'true'

if USE_MINIO:
    # MinIO configuration
    MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'http://minio:9000')
    MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
    MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin123')
    MINIO_REGION = os.getenv('MINIO_REGION', 'us-east-1')
    MINIO_BUCKET_NAME = os.getenv('MINIO_BUCKET_NAME', 'preparc')
    
    s3 = boto3.client('s3',
                      endpoint_url=MINIO_ENDPOINT,
                      aws_access_key_id=MINIO_ACCESS_KEY,
                      aws_secret_access_key=MINIO_SECRET_KEY,
                      region_name=MINIO_REGION,
                      aws_session_token=None,
                      verify=False)
else:
    # AWS S3 configuration
    AWS_ACCESS_KEY = os.getenv('VITE_PUBLIC_S3_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.getenv('VITE_PUBLIC_S3_SECRET_ACCESS_KEY')
    AWS_REGION = os.getenv('VITE_PUBLIC_S3_REGION')
    MINIO_BUCKET_NAME = os.getenv('AWS_S3_BUCKET')
    
    s3 = boto3.client('s3',
                      aws_access_key_id=AWS_ACCESS_KEY,
                      aws_secret_access_key=AWS_SECRET_KEY,
                      region_name=AWS_REGION)

print(f"Using {'MinIO' if USE_MINIO else 'AWS S3'} for storage")

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'webm'}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max upload

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def download_video_from_s3(s3_url):
    """Download a video from S3/MinIO to local storage."""
    try:
        parsed_url = urlparse(s3_url)
        
        if USE_MINIO:
            # For MinIO URLs like http://localhost:9000/bucket/key
            # Extract bucket and key from the path
            path_parts = parsed_url.path.lstrip('/').split('/', 1)
            bucket_name = path_parts[0]
            key = path_parts[1] if len(path_parts) > 1 else ''
        else:
            # For AWS S3 URLs
            bucket_name = parsed_url.netloc.split('.')[0]
            key = parsed_url.path.lstrip('/')

        filename = os.path.basename(key)
        local_path = os.path.join(UPLOAD_FOLDER, filename)

        logger.info(f"Downloading video from {'MinIO' if USE_MINIO else 'S3'}: {bucket_name}/{key} -> {local_path}")
        
        # Use the configured bucket name if available
        bucket_to_use = MINIO_BUCKET_NAME if USE_MINIO else bucket_name
        s3.download_file(bucket_to_use, key, local_path)
        logger.info(f"Downloaded successfully: {local_path}")

        return local_path
    except ClientError as e:
        logger.error(f"Error accessing S3: {str(e)}")
        raise Exception(f"Error accessing S3: {str(e)}")
    except NoCredentialsError:
        logger.error("AWS Credentials not found")
        raise Exception("AWS credentials not found")
    
class FacialExpressionAnalyzer:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Initialize MediaPipe Face Mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize counters and tracking variables
        self.blink_count = 0
        self.looking_sideways_count = 0
        self.expression_history = deque(maxlen=30)  # Store last 30 expressions for smoothing
        self.frame_expression_data = []  # Store per-frame analysis data
        self.blink_start_time = None
        self.blink_detected = False
        self.previous_eye_state = "open"
        self.eye_closed_start_time = None
        self.eye_closed_threshold = 0.22  # Threshold for considering eyes closed
        self.sideways_look_threshold = 0.3  # Threshold for considering looking sideways
        self.sideways_start_time = None
        self.sideways_looking = False
        self.session_metrics = {
            "Confident": 0,
            "Confused": 0,
            "Uncertain": 0,
            "Neutral": 0,
            "Calm": 0,
            "Anxious": 0,
            "Thinking": 0,
            "Total": 0
        }
        self.sideways_duration = 0
        self.eye_contact_duration = 0
        self.total_duration = 0
        
    def calculate_face_metrics(self, face_landmarks, image_shape):
        if not face_landmarks:
            return None
            
        h, w = image_shape[:2]
        landmarks = np.array([[lm.x * w, lm.y * h] for lm in face_landmarks.landmark])
        
        # Key facial points indices (using MediaPipe's standard indices)
        # Eyes
        left_eye_indices = list(self.mp_face_mesh.FACEMESH_LEFT_EYE)
        right_eye_indices = list(self.mp_face_mesh.FACEMESH_RIGHT_EYE)
        left_eye_pts = [362, 385, 387, 263, 373, 380]  # Top, bottom, and corner points
        right_eye_pts = [33, 160, 158, 133, 153, 144]  # Top, bottom, and corner points
        
        # Mouth points
        mouth_top = landmarks[13]  # Upper lip
        mouth_bottom = landmarks[14]  # Lower lip
        mouth_left = landmarks[78]  # Left corner
        mouth_right = landmarks[308]  # Right corner
        
        # Eyebrows
        left_eyebrow_inner = landmarks[336]
        right_eyebrow_inner = landmarks[107]
        left_eyebrow_outer = landmarks[296]
        right_eyebrow_outer = landmarks[67]
        
        # Nose and face orientation
        nose_tip = landmarks[4]
        left_eye_center = landmarks[386]
        right_eye_center = landmarks[159]
        
        # Face width for normalization
        face_width = np.linalg.norm(landmarks[234] - landmarks[454])
        
        # Calculate detailed metrics
        metrics = {
            'mouth_width': np.linalg.norm(mouth_left - mouth_right) / face_width,
            'mouth_height': np.linalg.norm(mouth_top - mouth_bottom) / face_width,
            'mouth_ratio': np.linalg.norm(mouth_left - mouth_right) / (np.linalg.norm(mouth_top - mouth_bottom) + 1e-6),
            'mouth_corner_ratio': abs(mouth_left[1] - mouth_right[1]) / face_width,
            'eyebrow_height': ((left_eyebrow_inner[1] + right_eyebrow_inner[1]) / 2) / h,
            'eyebrow_raise': ((left_eyebrow_outer[1] + right_eyebrow_outer[1]) / 2) / h,
            'eyebrow_furrow': np.linalg.norm(left_eyebrow_inner - right_eyebrow_inner) / face_width,
            'eye_aspect_ratio': self.calculate_eye_aspect_ratio(landmarks, left_eye_pts, right_eye_pts),
            'eye_distance': np.linalg.norm(left_eye_center - right_eye_center) / face_width,
            'head_yaw': self.calculate_head_yaw(landmarks, nose_tip, left_eye_center, right_eye_center),
            'head_pitch': self.calculate_head_pitch(landmarks),
            'forehead_wrinkle': self.calculate_forehead_wrinkle(landmarks)
        }
        
        return metrics

    def calculate_eye_aspect_ratio(self, landmarks, left_eye_pts, right_eye_pts):
        def eye_ratio(pts):
            # Vertical distances
            v1 = np.linalg.norm(landmarks[pts[1]] - landmarks[pts[5]])
            v2 = np.linalg.norm(landmarks[pts[2]] - landmarks[pts[4]])
            # Horizontal distance
            h = np.linalg.norm(landmarks[pts[0]] - landmarks[pts[3]])
            return (v1 + v2) / (2.0 * h + 1e-6)
            
        left_ear = eye_ratio(left_eye_pts)
        right_ear = eye_ratio(right_eye_pts)
        
        return (left_ear + right_ear) / 2.0

    def calculate_head_yaw(self, landmarks, nose_tip, left_eye, right_eye):
        # Calculate horizontal angle (yaw)
        eye_center = (left_eye + right_eye) / 2
        eye_distance = np.linalg.norm(left_eye - right_eye)
        nose_offset = nose_tip[0] - eye_center[0]
        # Normalize by eye distance
        return nose_offset / (eye_distance + 1e-6)

    def calculate_head_pitch(self, landmarks):
        # Using nose and chin relationship to estimate pitch
        nose_tip = landmarks[4]
        chin = landmarks[152]
        return (nose_tip[1] - chin[1]) / np.linalg.norm(nose_tip - chin)

    def calculate_forehead_wrinkle(self, landmarks):
        # Simplified measure of forehead wrinkle using eyebrow and forehead points
        forehead_top = landmarks[10]  # Top of forehead
        eyebrow_center = (landmarks[107] + landmarks[336]) / 2  # Center of eyebrows
        return np.linalg.norm(forehead_top - eyebrow_center)

    def analyze_expression(self, metrics):
        if not metrics:
            return "No Face Detected", 0, {}
            
        expression_scores = {
            "Confident": 0.0,
            "Confused": 0.0,
            "Uncertain": 0.0,
            "Neutral": 0.0,
            "Calm": 0.0,
            "Anxious": 0.0,
            "Thinking": 0.0
        }
        
        # Confident expression
        if (0.25 < metrics['eye_aspect_ratio'] < 0.35 and 
            metrics['mouth_ratio'] > 1.5 and
            metrics['head_yaw'] < 0.15 and
            metrics['eyebrow_height'] < 0.41):
            expression_scores["Confident"] += 0.8
                
        # Confused expression
        if (metrics['eyebrow_furrow'] > 0.15 and 
            metrics['mouth_ratio'] < 1.2 and
            metrics['mouth_corner_ratio'] > 0.02):
            expression_scores["Confused"] += 0.7
                
        # Uncertain expression
        if (metrics['mouth_ratio'] < 1.3 and 
            metrics['eyebrow_raise'] < 0.38 and
            metrics['mouth_corner_ratio'] > 0.015):
            expression_scores["Uncertain"] += 0.6
                
        # Neutral expression
        if (1.2 <= metrics['mouth_ratio'] <= 1.5 and 
            0.38 <= metrics['eyebrow_height'] <= 0.44 and
            abs(metrics['head_yaw']) < 0.1 and
            metrics['mouth_corner_ratio'] < 0.02):
            expression_scores["Neutral"] += 0.7
        
        # Calm expression
        if (1.3 <= metrics['mouth_ratio'] <= 1.6 and
            0.24 <= metrics['eye_aspect_ratio'] <= 0.32 and
            metrics['eyebrow_height'] > 0.39 and
            abs(metrics['head_yaw']) < 0.1):
            expression_scores["Calm"] += 0.75
        
        # Anxious expression
        if (metrics['eye_aspect_ratio'] > 0.3 and
            metrics['eyebrow_raise'] > 0.41 and
            metrics['mouth_height'] < 0.1):
            expression_scores["Anxious"] += 0.65
        
        # Thinking expression
        if (metrics['eye_aspect_ratio'] < 0.28 and
            metrics['eyebrow_furrow'] > 0.12 and
            metrics['head_pitch'] > 0.1):
            expression_scores["Thinking"] += 0.7
            
        # Get highest scoring expression
        max_score = max(expression_scores.values())
        if max_score < 0.4:  # Higher threshold for more accuracy
            expression = "Neutral"
            confidence = 0.4
        else:
            expression = max(expression_scores.items(), key=lambda x: x[1])[0]
            confidence = max_score
            
        # Smooth expression predictions using history
        self.expression_history.append(expression)
        expression = max(set(self.expression_history), key=self.expression_history.count)
        
        # Update session metrics
        self.session_metrics[expression] += 1
        self.session_metrics["Total"] += 1
        
        return expression, confidence * 100, expression_scores

    def detect_blink(self, metrics):
        """Improved blink detection with state tracking"""
        if not metrics:
            return False
        
        is_blinking = False
        
        # Current eye state
        current_eye_state = "closed" if metrics['eye_aspect_ratio'] < self.eye_closed_threshold else "open"
        
        # Detect blink (transition from open to closed and back to open)
        if self.previous_eye_state == "open" and current_eye_state == "closed":
            self.eye_closed_start_time = time.time()
            self.blink_detected = True
        elif self.previous_eye_state == "closed" and current_eye_state == "open" and self.blink_detected:
            # Only count as a blink if the eyes were closed for a short time (< 0.4 seconds)
            if self.eye_closed_start_time and (time.time() - self.eye_closed_start_time) < 0.4:
                self.blink_count += 1
                is_blinking = True
            self.blink_detected = False
            
        # Update previous state
        self.previous_eye_state = current_eye_state
        
        return is_blinking

    def detect_looking_sideways(self, metrics):
        if not metrics:
            return False, 0
        
        # Check if user is looking sideways (using head yaw)
        currently_looking_sideways = abs(metrics['head_yaw']) > self.sideways_look_threshold
        
        # Start timing if just started looking sideways
        if currently_looking_sideways and not self.sideways_looking:
            self.sideways_looking = True
            self.sideways_start_time = time.time()
        # Stop timing if no longer looking sideways
        elif not currently_looking_sideways and self.sideways_looking:
            self.sideways_looking = False
            if self.sideways_start_time:
                self.sideways_duration += time.time() - self.sideways_start_time
                self.looking_sideways_count += 1
        
        # Calculate how long the person is looking sideways in the current moment
        current_sideways_duration = 0
        if self.sideways_looking and self.sideways_start_time:
            current_sideways_duration = time.time() - self.sideways_start_time
        
        return currently_looking_sideways, current_sideways_duration

    def calculate_eye_contact(self, metrics):
        """Calculate if user is maintaining eye contact with camera"""
        if not metrics:
            return False
            
        # Consider eye contact when head is facing forward and eyes are open
        is_eye_contact = (
            abs(metrics['head_yaw']) < self.sideways_look_threshold and 
            metrics['eye_aspect_ratio'] > self.eye_closed_threshold
        )
        
        # Update eye contact duration
        if is_eye_contact:
            self.eye_contact_duration += 1/30  # Assuming 30 FPS
            
        self.total_duration += 1/30  # Assuming 30 FPS
            
        return is_eye_contact

    def analyze_video(self, video_path, sample_rate=1):
        """
        Analyze video file and return facial expression analysis results
        sample_rate: Process 1 out of every N frames (for speed)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video file"}

        frame_count = 0
        processed_frames = 0
        face_detected_frames = 0
        start_time = time.time()
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Reset analyzer state
        self.__init__()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Process only every Nth frame
            if frame_count % sample_rate != 0:
                continue
                
            processed_frames += 1
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            metrics = None
            frame_data = {
                "frame_number": frame_count,
                "timestamp": frame_count / fps,
                "face_detected": False
            }
            
            if results.multi_face_landmarks:
                face_detected_frames += 1
                frame_data["face_detected"] = True
                
                # Calculate metrics and analyze expression
                metrics = self.calculate_face_metrics(results.multi_face_landmarks[0], frame.shape)
                expression, conf, all_scores = self.analyze_expression(metrics)
                
                # Detect blinks
                is_blinking = self.detect_blink(metrics)
                
                # Detect sideways looking
                looking_sideways, sideways_duration = self.detect_looking_sideways(metrics)
                
                # Calculate eye contact
                eye_contact = self.calculate_eye_contact(metrics)
                
                # Store frame data
                frame_data.update({
                    "expression": expression,
                    "confidence": conf,
                    "expression_scores": all_scores,
                    "is_blinking": is_blinking,
                    "looking_sideways": looking_sideways,
                    "eye_contact": eye_contact
                })
            
            self.frame_expression_data.append(frame_data)
        
        cap.release()
        
        # Calculate total video duration
        duration = total_frames / fps if fps > 0 else 0
        self.total_duration = duration
        
        # Generate final report
        return self.generate_report(processed_frames, face_detected_frames, duration)

    def generate_report(self, processed_frames, face_detected_frames, duration):
        """Generate a dictionary with all analysis results"""
        # Calculate dominant expression
        dominant_expr = "Unknown"
        if self.session_metrics["Total"] > 0:
            dominant_expr = max([k for k in self.session_metrics if k != "Total"], 
                               key=lambda k: self.session_metrics[k])

        # Prepare expression distribution with percentages
        expression_distribution = {}
        for expr in self.session_metrics:
            if expr != "Total" and self.session_metrics["Total"] > 0:
                expression_distribution[expr] = (self.session_metrics[expr] / self.session_metrics["Total"]) * 100
        
        # Calculate eye contact percentage
        eye_contact_percentage = (self.eye_contact_duration / self.total_duration * 100) if self.total_duration > 0 else 0
        
        # Calculate blink rate per minute
        blink_rate = self.blink_count / (self.total_duration / 60) if self.total_duration > 0 else 0
        
        report = {
            "summary": {
                "video_duration": self.total_duration,
                "processed_frames": processed_frames,
                "face_detected_frames": face_detected_frames,
                "face_detection_rate": (face_detected_frames / processed_frames * 100) if processed_frames > 0 else 0
            },
            "expressions": {
                "dominant_expression": dominant_expr,
                "expression_distribution": expression_distribution
            },
            "eye_metrics": {
                "blink_count": self.blink_count,
                "blink_rate_per_minute": blink_rate,
                "eye_contact_percentage": eye_contact_percentage,
            },
            "attention_metrics": {
                "looking_away_count": self.looking_sideways_count,
                "looking_away_duration": self.sideways_duration,
                "looking_away_percentage": (self.sideways_duration / self.total_duration * 100) if self.total_duration > 0 else 0
            },
            "assessment": {
                "confidence_level": expression_distribution.get("Confident", 0),
                "anxiety_level": expression_distribution.get("Anxious", 0),
                "uncertainty_level": expression_distribution.get("Uncertain", 0),
                "focus_level": eye_contact_percentage,
            },
        }
        
        return report

@app.route('/analyze-video', methods=['POST'])
def analyze_video():
    """Endpoint to analyze facial expressions from an S3 video."""
    data = request.json
    if 's3_url' not in data:
        return jsonify({'error': 'Missing s3_url'}), 400
    
    try:
        # Get sample rate parameter (default to 3 - process every 3rd frame for speed)
        sample_rate = int(request.form.get('sample_rate', 3))
        # Download video from S3
        video_path = download_video_from_s3(data['s3_url'])

        # Analyze the video
        analyzer = FacialExpressionAnalyzer()
        results = analyzer.analyze_video(video_path, sample_rate)
        
        def convert_to_json_serializable(data):
            if isinstance(data, np.ndarray):  # Convert NumPy arrays
                return data.tolist()
            elif isinstance(data, np.bool_):  # Convert NumPy booleans
                return bool(data)
            elif isinstance(data, dict):  # Recursively process dictionaries
                return {k: convert_to_json_serializable(v) for k, v in data.items()}
            elif isinstance(data, list):  # Recursively process lists
                return [convert_to_json_serializable(v) for v in data]
            return data
        
        results = convert_to_json_serializable(results)
        # Cleanup the uploaded file to save space
        os.remove(video_path)
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({'error': f"Error analyzing video: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Facial Analysis API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)