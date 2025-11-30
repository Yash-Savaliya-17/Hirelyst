import cv2
import mediapipe as mp
import numpy as np
import argparse
from collections import deque
import time

class FacialExpressionAnalyzer:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
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
        self.blink_start_time = None  # Track blink start time
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
                
        # Uncertain expression (replaced "Not Sure")
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
        
        # Calm expression (new)
        if (1.3 <= metrics['mouth_ratio'] <= 1.6 and
            0.24 <= metrics['eye_aspect_ratio'] <= 0.32 and
            metrics['eyebrow_height'] > 0.39 and
            abs(metrics['head_yaw']) < 0.1):
            expression_scores["Calm"] += 0.75
        
        # Anxious expression (new)
        if (metrics['eye_aspect_ratio'] > 0.3 and
            metrics['eyebrow_raise'] > 0.41 and
            metrics['mouth_height'] < 0.1):
            expression_scores["Anxious"] += 0.65
        
        # Thinking expression (new)
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

    def detect_malicious_activity(self, metrics):
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

    def run(self, source=0):
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise ValueError("Could not open video source")

        frame_count = 0
        start_time = time.time()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            # Create a clean display frame
            display_frame = frame.copy()
            metrics = None
            
            if results.multi_face_landmarks:
                # Draw face mesh (subtle display for less distraction)
                self.mp_drawing.draw_landmarks(
                    image=display_frame,
                    landmark_list=results.multi_face_landmarks[0],
                    connections=self.mp_face_mesh.FACEMESH_CONTOURS,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_contours_style()
                )
                
                # Calculate metrics and analyze expression
                metrics = self.calculate_face_metrics(results.multi_face_landmarks[0], frame.shape)
                expression, conf, all_scores = self.analyze_expression(metrics)
                
                # Detect blinks
                is_blinking = self.detect_blink(metrics)
                
                # Detect sideways looking
                looking_sideways, sideways_duration = self.detect_malicious_activity(metrics)
                
                # Calculate eye contact
                eye_contact = self.calculate_eye_contact(metrics)
                
                # Display results
                y_offset = 30
                cv2.putText(display_frame, f"Expression: {expression} ({conf:.1f}%)", 
                           (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # Display top 3 expression scores
                sorted_scores = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
                for i, (expr, score) in enumerate(sorted_scores[:3]):
                    y_offset += 30
                    cv2.putText(display_frame, f"{expr}: {score*100:.1f}%", 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
                
                # Display eye contact and blinking info
                y_offset += 40
                cv2.putText(display_frame, f"Blinks: {self.blink_count}", 
                           (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                eye_contact_percent = (self.eye_contact_duration / self.total_duration * 100) if self.total_duration > 0 else 0
                y_offset += 30
                cv2.putText(display_frame, f"Eye Contact: {eye_contact_percent:.1f}%", 
                           (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # Display sideways looking warning
                if looking_sideways:
                    y_offset += 30
                    cv2.putText(display_frame, f"Warning: Looking Away ({sideways_duration:.1f}s)", 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                # Display real-time notification for blinking
                if is_blinking:
                    cv2.putText(display_frame, "Blink Detected", 
                               (frame.shape[1] - 200, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                # No face detected
                cv2.putText(display_frame, "No Face Detected", 
                           (int(frame.shape[1]/2) - 100, int(frame.shape[0]/2)), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            
            # Display elapsed time
            elapsed_time = time.time() - start_time
            cv2.putText(display_frame, f"Time: {elapsed_time:.1f}s", 
                       (frame.shape[1] - 150, frame.shape[0] - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Interview Expression Analysis', display_frame)
            
            # Press 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
            frame_count += 1
        
        cap.release()
        cv2.destroyAllWindows()
        self.face_mesh.close()
        
        # Print final analysis
        self.print_final_analysis(frame_count, elapsed_time)
        
        return self.generate_report()

    def print_final_analysis(self, frame_count, elapsed_time):
        print("\n" + "="*50)
        print("INTERVIEW EXPRESSION ANALYSIS REPORT")
        print("="*50)
        print(f"Total duration: {elapsed_time:.2f} seconds")
        print(f"Total frames analyzed: {frame_count}")
        print(f"Total blinking occurrences: {self.blink_count}")
        print(f"Blink rate: {self.blink_count / (elapsed_time/60):.2f} blinks per minute")
        print(f"Looking away count: {self.looking_sideways_count}")
        print(f"Total time looking away: {self.sideways_duration:.2f} seconds ({(self.sideways_duration/elapsed_time)*100:.1f}%)")
        print(f"Eye contact maintained: {(self.eye_contact_duration/elapsed_time)*100:.1f}% of the time")
        
        print("\nExpression Distribution:")
        for expr in self.session_metrics:
            if expr != "Total" and self.session_metrics["Total"] > 0:
                percentage = (self.session_metrics[expr] / self.session_metrics["Total"]) * 100
                print(f"{expr}: {percentage:.1f}%")
        
        # Determine dominant expression
        dominant_expr = max([k for k in self.session_metrics if k != "Total"], 
                           key=lambda k: self.session_metrics[k])
        print(f"\nDominant expression: {dominant_expr}")
        
        # Provide interview assessment
        print("\nInterview Behavior Assessment:")
        if self.sideways_duration > (elapsed_time * 0.15):
            print("⚠️ Candidate frequently looked away from the camera, which may indicate reference to external materials.")
        if (self.eye_contact_duration/elapsed_time) < 0.7:
            print("⚠️ Candidate maintained relatively low eye contact.")
        if dominant_expr == "Confident" and (self.eye_contact_duration/elapsed_time) > 0.8:
            print("✅ Candidate appeared confident and maintained good eye contact.")
        if dominant_expr == "Anxious":
            print("ℹ️ Candidate displayed signs of interview anxiety.")
        if dominant_expr == "Thinking":
            print("✅ Candidate showed thoughtful consideration before responding.")
        
        print("="*50)

    def generate_report(self):
        """Generate a dictionary with all analysis results for external use"""
        report = {
            "blink_count": self.blink_count,
            "looking_sideways_count": self.looking_sideways_count,
            "sideways_duration": self.sideways_duration,
            "eye_contact_percentage": (self.eye_contact_duration/self.total_duration)*100 if self.total_duration > 0 else 0,
            "expression_distribution": {
                expr: (self.session_metrics[expr] / self.session_metrics["Total"]) * 100 
                if self.session_metrics["Total"] > 0 else 0
                for expr in self.session_metrics if expr != "Total"
            },
            "dominant_expression": max([k for k in self.session_metrics if k != "Total"], 
                                      key=lambda k: self.session_metrics[k]) if self.session_metrics["Total"] > 0 else "Unknown"
        }
        return report

def main():
    parser = argparse.ArgumentParser(description='Interview Facial Expression Analysis')
    parser.add_argument('--source', type=int, default=0,
                        help='Camera source (default: 0)')
    args = parser.parse_args()
    
    try:
        print("Starting Interview Expression Analysis...")
        print("Press 'q' to end the session and see the final report.")
        analyzer = FacialExpressionAnalyzer()
        report = analyzer.run(args.source)
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()