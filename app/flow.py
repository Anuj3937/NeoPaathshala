import re
import os
import json
import base64
from google.adk.runners import Runner  # type: ignore
from google.genai import types
from agents import content_generator_agent
import requests
from dotenv import load_dotenv
from google.adk.sessions import InMemorySessionService  # type: ignore

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
API_KEY = os.getenv("MAPS_API")
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

sessions = InMemorySessionService()

def geoip():
    res = requests.post(
        f"https://www.googleapis.com/geolocation/v1/geolocate?key={API_KEY}",
        json={ "considerIp": True }

    )
    res.raise_for_status()
    res1 = res.json()["location"]
    Lat,Lng=res1['lat'],res1['lng']
    # lat,lang = res1
    res = requests.post(
        f"https://maps.googleapis.com/maps/api/geocode/json?latlng={Lat},{Lng}&key={API_KEY}",
        json={ "considerIp": True }
    )
    res.raise_for_status()
    res2 = (res.json())['results'][-2]["address_components"][0]["long_name"]
    print(res2)
    return res2

# ---------- Runner Helper ----------
def run_agent(agent, user_id: str, session_id: str, prompt: str):
    runner = Runner(app_name="neo", agent=agent, session_service=sessions)
    content = types.Content(role="User",parts=[types.Part(text=prompt)])
    events = runner.run(
        user_id=user_id,
        session_id=session_id,
        new_message=content
    )
    for event in events:
        if event.is_final_response():
            final_response = event.content.parts[0].text
            return final_response
        
def generate_image_base64(prompt: str) -> str:
    from google import genai

    client = genai.Client(api_key=GOOGLE_API_KEY)

    result = client.models.generate_images(
        model="models/imagen-4.0-generate-preview-06-06",
        prompt=prompt,
        config=dict(
            number_of_images=1,
            output_mime_type="image/jpeg",
            person_generation="ALLOW_ADULT",
            aspect_ratio="1:1",
        ),
    )

    if not result.generated_images:
        raise RuntimeError("No images generated.")

    img_bytes = result.generated_images[0].image.image_bytes
    base64_str = base64.b64encode(img_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{base64_str}"

def extract_json_from_response(response_text: str):
    """
    Attempts to extract and parse the first valid JSON object from a messy LLM response.
    Returns a Python dict if successful, else raises ValueError.
    """
    try:
        # Match the first {...} JSON object block in the response
        match = re.search(r'\{[\s\S]*?\}', response_text)
        if not match:
            raise ValueError("No valid JSON object found in response.")

        json_str = match.group(0)

        # Try parsing it
        parsed = json.loads(json_str)

        # Optional: validate expected keys
        if "cultural_refs" not in parsed or not isinstance(parsed["cultural_refs"], list):
            raise ValueError("Parsed JSON missing required 'cultural_refs' list.")

        return parsed

    except json.JSONDecodeError as e:
        raise ValueError(f"JSON decode error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Unexpected error while parsing JSON: {str(e)}")
    
def safe_parse_generated_content(response: str) -> str:
    """
    Safely extracts the 'content' field from a response string.
    If 'content' is missing but 'mermaid' is present in the text, return the whole response.
    Returns empty string otherwise.
    """
    # Step 1: Try JSON parsing
    try:
        parsed = json.loads(response)
        if "content" in parsed:
            return _clean_content(parsed["content"])
    except json.JSONDecodeError:
        pass

    # Step 2: Regex fallback for content
    match = re.search(r'"content"\s*:\s*"([\s\S]*?)"\s*}', response)
    if match:
        raw_content = match.group(1)
        try:
            unescaped = bytes(raw_content, "utf-8").decode("unicode_escape")
            return _clean_content(unescaped)
        except Exception:
            return _clean_content(raw_content)

    # Step 4: Fallback to empty string
    return ""


import html

def _clean_content(content: str) -> str:
    """
    Cleans up markdown-wrapped content and converts it to HTML.
    - Decodes special characters
    - Converts **bold** to <strong>bold</strong>
    - Converts lines starting with ### to bolded text
    - Converts \n to <br/>
    """
    # Remove triple backticks and optional language tag
    content = content.strip()
    if content.startswith("```") and content.endswith("```"):
        content = re.sub(r"^```[\w]*\n?", "", content)
        content = content.rstrip("`").strip()
    # Remove horizontal rules or repeated dashes (3 or more)
    content = re.sub(r"\n?-{3}\n?", "\n", content)
    # Decode any byte-style characters into proper unicode
    content = content.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")

    # Convert markdown headings (e.g., # Heading, ## Heading) to <strong>
    content = re.sub(r"^#{1,6}\s?(.*)", r"<strong>\1</strong>", content, flags=re.MULTILINE)

    # Convert *text*, **text**, ***text*** into <strong>text</strong> (allowing multiple words)
    content = re.sub(r"\*{1,}\s*([^\*]+?)\s*\*{1,}", r"<strong>\1</strong>", content)

    # Escape HTML characters to prevent injection, then unescape added tags
    content = html.escape(content)
    content = content.replace("&lt;strong&gt;", "<strong>").replace("&lt;/strong&gt;", "</strong>")

    # Replace line breaks with <br/>
    content = content.replace("\n", "<br/>")

    return content
    
def generate_and_store_content(grade_level, content_type, prompt, user_id, session_id):
    content_type = content_type.split(":", 1)[0].strip().lower()
    print(content_type)


    if content_type == "diagram":
        response = generate_image_base64(prompt)
        print(f"✅ Generated content for Grade {grade_level}, Type {content_type}")
        return response
    else:    
        response = run_agent(content_generator_agent, user_id, session_id, prompt)
        try:
            parsed = safe_parse_generated_content(response)
            print(f"✅ Generated content for Grade {grade_level}, Type {content_type}")
            print(response)
            return parsed
        except ValueError as e:
            print(f"❌ Failed to parse content for Grade {grade_level}, Type {content_type} - {e}")
            return ""