from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import logging
import tempfile
import azure.cognitiveservices.speech as speechsdk
from azure.storage.blob import BlobServiceClient
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv
import json
import time

load_dotenv()

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI()

# Azure Speech Configuration
AZURE_SPEECH_KEY = os.getenv('AZURE_SPEECH_KEY')
AZURE_SPEECH_REGION = os.getenv('AZURE_SPEECH_REGION', 'centralindia')

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_CONTAINER_NAME = os.getenv('AZURE_CONTAINER_NAME', 'preparc')

# Validate environment variables
if not AZURE_SPEECH_KEY:
    logger.error("❌ AZURE_SPEECH_KEY not found in environment variables")
    raise ValueError("AZURE_SPEECH_KEY is required")
    
if not AZURE_STORAGE_CONNECTION_STRING:
    logger.error("❌ AZURE_STORAGE_CONNECTION_STRING not found in environment variables")
    raise ValueError("AZURE_STORAGE_CONNECTION_STRING is required")

logger.info(f"✅ Azure Speech configured for region: {AZURE_SPEECH_REGION}")
logger.info(f"✅ Azure Blob Storage container: {AZURE_CONTAINER_NAME}")


# Request/Response Models
class BodyInput(BaseModel):
    s3_url: str


class TranscriptionResponse(BaseModel):
    recognized_speech: str
    confidence: float
    duration: float


def download_video_from_azure(video_url: str, local_path: str):
    """Download video from Azure Blob Storage"""
    try:
        logger.info(f"📥 Downloading video from: {video_url}")
        
        # Extract blob name from URL
        # Example: https://preparcblob.blob.core.windows.net/preparc/video-123.mp4
        blob_name = video_url.split(f"/{AZURE_CONTAINER_NAME}/")[-1]
        
        blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_STORAGE_CONNECTION_STRING
        )
        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )
        
        with open(local_path, "wb") as download_file:
            download_file.write(blob_client.download_blob().readall())
        
        logger.info(f"✅ Video downloaded successfully: {local_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to download video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Video download failed: {str(e)}")


def extract_audio_from_video(video_path: str, audio_path: str):
    """Extract audio from video file"""
    try:
        logger.info(f"🎵 Extracting audio from video: {video_path}")
        video_clip = VideoFileClip(video_path)
        audio_clip = video_clip.audio
        audio_clip.write_audiofile(audio_path, logger=None)
        audio_clip.close()
        video_clip.close()
        logger.info(f"✅ Audio extracted: {audio_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Audio extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")


def transcribe_audio_with_azure(audio_path: str):
    """Transcribe audio using Azure Speech-to-Text"""
    try:
        logger.info(f"🎤 Transcribing audio with Azure Speech: {audio_path}")
        
        # Configure Azure Speech
        speech_config = speechsdk.SpeechConfig(
            subscription=AZURE_SPEECH_KEY,
            region=AZURE_SPEECH_REGION
        )
        speech_config.speech_recognition_language = "en-US"
        speech_config.output_format = speechsdk.OutputFormat.Detailed
        
        # Create audio config from file
        audio_config = speechsdk.AudioConfig(filename=audio_path)
        
        # Create speech recognizer
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        # Perform continuous recognition
        transcription = []
        confidences = []
        done = False
        
        def recognized_cb(evt):
            if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                transcription.append(evt.result.text)
                try:
                    if hasattr(evt.result, 'properties'):
                        conf = evt.result.properties.get(
                            speechsdk.PropertyId.SpeechServiceResponse_JsonResult
                        )
                        if conf:
                            conf_data = json.loads(conf)
                            if 'NBest' in conf_data and len(conf_data['NBest']) > 0:
                                confidences.append(conf_data['NBest'][0].get('Confidence', 0.95))
                            else:
                                confidences.append(0.95)
                        else:
                            confidences.append(0.95)
                    else:
                        confidences.append(0.95)
                except:
                    confidences.append(0.95)
                logger.info(f"📝 Recognized: {evt.result.text}")
            elif evt.result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("⚠️ No speech could be recognized")
        
        def stop_cb(evt):
            nonlocal done
            done = True
            logger.info("🛑 Recognition stopped")
        
        def canceled_cb(evt):
            nonlocal done
            logger.error(f"❌ Recognition canceled: {evt.cancellation_details.reason}")
            if evt.cancellation_details.reason == speechsdk.CancellationReason.Error:
                logger.error(f"Error details: {evt.cancellation_details.error_details}")
            done = True
        
        # Connect callbacks
        speech_recognizer.recognized.connect(recognized_cb)
        speech_recognizer.session_stopped.connect(stop_cb)
        speech_recognizer.canceled.connect(canceled_cb)
        
        # Start continuous recognition
        speech_recognizer.start_continuous_recognition()
        
        # Wait for completion
        timeout = 300  # 5 minutes max
        elapsed = 0
        while not done and elapsed < timeout:
            time.sleep(0.5)
            elapsed += 0.5
        
        speech_recognizer.stop_continuous_recognition()
        
        # Combine all recognized text
        full_text = " ".join(transcription)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        if not full_text:
            logger.warning("⚠️ No speech detected in audio")
            return {
                "text": "No speech detected in the audio. Please ensure your microphone is working and speak clearly.",
                "confidence": 0.0
            }
        
        logger.info(f"✅ Transcription complete: {len(full_text)} characters, confidence: {avg_confidence:.2f}")
        return {
            "text": full_text,
            "confidence": avg_confidence
        }
        
    except Exception as e:
        logger.error(f"❌ Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "speech-to-text",
        "provider": "Azure Cognitive Services",
        "region": AZURE_SPEECH_REGION,
        "container": AZURE_CONTAINER_NAME
    }


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_s3_video(data: BodyInput):
    """
    Transcribe speech from video URL
    
    Args:
        data: Contains s3_url (Azure Blob Storage URL)
    
    Returns:
        Transcribed text with confidence score and duration
    """
    video_path = None
    audio_path = None
    
    try:
        logger.info(f"🎬 Starting transcription for: {data.s3_url}")
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as video_file:
            video_path = video_file.name
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
            audio_path = audio_file.name
        
        # Step 1: Download video from Azure Blob Storage
        download_video_from_azure(data.s3_url, video_path)
        
        # Step 2: Extract audio from video
        extract_audio_from_video(video_path, audio_path)
        
        # Step 3: Transcribe audio with Azure Speech
        result = transcribe_audio_with_azure(audio_path)
        
        # Get audio duration
        video = VideoFileClip(video_path)
        duration = video.duration
        video.close()
        
        logger.info(f"✅ Transcription successful: {len(result['text'])} chars, {duration}s duration")
        
        return TranscriptionResponse(
            recognized_speech=result["text"],
            confidence=result["confidence"],
            duration=duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temporary files
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
                logger.info(f"🗑️ Cleaned up video file: {video_path}")
            except:
                pass
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                logger.info(f"🗑️ Cleaned up audio file: {audio_path}")
            except:
                pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3003))
    uvicorn.run(app, host="0.0.0.0", port=port)