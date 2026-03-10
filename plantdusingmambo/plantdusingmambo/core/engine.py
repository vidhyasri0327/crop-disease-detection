import os
import json
import re
from dotenv import load_dotenv # type: ignore
load_dotenv()
import google.generativeai as genai # type: ignore
from PIL import Image # type: ignore

class MambaInference:
    def __init__(self):
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
    def forward(self, img_path, lang='en'):
        try:
            img = Image.open(img_path)
            
            if lang == 'ta':
                p = """நீங்கள் ஒரு தாவர நோய் கண்டறிதல் AI. தாவரப் படத்தை பகுப்பாய்வு செய்து, தமிழில் மட்டும் சரியான JSON வடிவில் பதிலளிக்கவும் (markdown இல்லை, கூடுதல் உரை இல்லை).

Format:
{"disease_name": "நோயின் பெயர் அல்லது ஆரோக்கியமானது", "confidence": 95.5, "description": "நோயின் விரிவான விளக்கம் தமிழில்", "remedies": ["தீர்வு 1 தமிழில்", "தீர்வு 2 தமிழில்", "தீர்வு 3 தமிழில்"]}

தாவரம் ஆரோக்கியமாக இருந்தால், disease_name ஐ "ஆரோக்கியமானது" என்று அமைக்கவும். அனைத்து உரைகளும் தமிழில் இருக்க வேண்டும்."""
            else:
                p = """You are a plant disease detection AI. Analyze the plant image and respond with ONLY a valid JSON object (no markdown, no extra text).

Format:
{"disease_name": "name or Healthy", "confidence": 95.5, "description": "brief description", "remedies": ["remedy 1", "remedy 2", "remedy 3"]}

If plant is healthy, set disease_name to "Healthy" and remedies to general care tips."""

            res = self.m.generate_content([p, img])
            raw = res.text.strip()
            raw = re.sub(r'^```json\s*', '', raw)
            raw = re.sub(r'^```\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)
            raw = raw.strip()
            
            parsed = json.loads(raw)
            return parsed
        except json.JSONDecodeError:
            if lang == 'ta':
                return {"disease_name": "பகுப்பாய்வு பிழை", "confidence": 0, "description": "பதிலை பாகுபடுத்த முடியவில்லை", "remedies": ["தெளிவான படத்தை பதிவேற்ற முயற்சிக்கவும்"]}
            return {"disease_name": "Analysis Error", "confidence": 0, "description": "Could not parse response", "remedies": ["Try uploading a clearer image"]}
        except Exception as e:
            if lang == 'ta':
                return {"disease_name": "பிழை", "confidence": 0, "description": str(e), "remedies": []}
            return {"disease_name": "Error", "confidence": 0, "description": str(e), "remedies": []}
