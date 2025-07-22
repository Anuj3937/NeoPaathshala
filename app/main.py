from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents import prompt_parser, culture_agent, mapper_agent,enricher_agent ,content_generator_agent
from google.adk.sessions import InMemorySessionService  # type: ignore
from google.adk.runners import Runner  # type: ignore
from google.genai import types
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
import json
from collections import defaultdict
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
API_KEY = os.getenv("MAPS_API")
# ---------- App Setup ----------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = InMemorySessionService()

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


# ---------- Request Schema ----------
class PromptRequest(BaseModel):
    prompt: str

import re

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

    # Step 3: Check for Mermaid keyword
    if "mermaid" in response.lower():
        return response.strip()

    # Step 4: Fallback to empty string
    return ""


def _clean_content(content: str) -> str:
    """
    Cleans up markdown-wrapped or backticked content, if present.
    """
    content = content.strip()

    # Remove triple backticks and optional language tag
    if content.startswith("```") and content.endswith("```"):
        content = re.sub(r"^```[\w]*\n?", "", content)
        content = content.rstrip("`").strip()

    return content
    
def generate_and_store_content(grade_levels, content_types, mapping_prompt, user_id, session_id):
    content_storage = defaultdict(dict)  # grade -> { content_type -> content }

    for grade in grade_levels:
        for ty in content_types:
            response = run_agent(content_generator_agent, user_id, session_id, mapping_prompt)
            print(response)
            try:
                if ty == "diagram":
                    response = response.replace('\n', ' ')  # Remove all line breaks
                    parsed = safe_parse_generated_content(response)
                    content_storage[grade][ty] = parsed
                    print("Diagram:",parsed)   
                else:
                    content_text = safe_parse_generated_content(response)
                    content_storage[grade][ty] = content_text
                print(f"✅ Generated content for Grade {grade}, Type {ty}")
            except ValueError as e:
                print(f"❌ Failed to parse content for Grade {grade}, Type {ty} - {e}")

    return content_storage

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
# ---------- Endpoint ----------
@app.post("/parse_and_map/")
async def parse_and_map(req: PromptRequest):
    prompt = req.prompt

    # Session Creation
    sess = await sessions.create_session(app_name ="neo",user_id="1234")

    # 1️⃣ Run Prompt Parser Agent
    analysis_str = run_agent(prompt_parser, sess.user_id, sess.id, prompt)
    try:
        analysis = json.loads(analysis_str)
        print("Extracted Analytical Result:", analysis)
    except ValueError as e:
        print("Failed to parse JSON:", e)

    print(f"Analysis:{analysis}")
    # Extract values
    topic = analysis.get("topic")
    grade_levels = analysis.get("grade_levels")
    content_types = analysis.get("content_types")
    need_grade = analysis.get("need_grade")
    location = geoip()
    print(f"Location:{location}")
    # 2️⃣ Always Run Culture Agent
    culture_prompt = f"For the location of :{location} stick to this for the google search for the topic:{topic}"
    culture_str = run_agent(culture_agent, sess.user_id, sess.id, culture_prompt)
    print(f"Culture:{culture_str}")
    try:
        parsed_json = extract_json_from_response(culture_str)
        cultural_refs = parsed_json["cultural_refs"]
        print("Extracted Cultural References:", cultural_refs)
    except ValueError as e:
        print("Failed to parse  culture JSON:", e)
    print(cultural_refs)
    mapping_prompt = f"Culture_refs:{cultural_refs},\nUser query:{prompt}"
    # 3️⃣ If grade levels are missing
    if need_grade:
        mapper_result_str = run_agent(mapper_agent, sess.user_id, sess.id, mapping_prompt)
        try:
            mapper_result = json.loads(mapper_result_str)
            if "grade_levels" in mapper_result:
                grade_levels = mapper_result["grade_levels"]
        except json.JSONDecodeError:
            print("Grade mapper agent returned invalid JSON")
    print(grade_levels)
    for grade in grade_levels:
        for ty in content_types:
            builder_prompt = f"Grade Level:{grade}\n{mapping_prompt}\nContent Type:{ty}"
            enriched_prompt = run_agent(enricher_agent,sess.user_id,sess.id,builder_prompt)
            print(enriched_prompt)
            content = generate_and_store_content(grade_levels,content_types,enriched_prompt,sess.user_id,sess.id)
            if ty == "diagram":
                print(content)
    print(content)
    return {
        "topic": topic,
        "grade_levels": grade_levels,
        "content_types": content_types,
        "cultural_refs": cultural_refs,
        "generated_content": content
    }



@app.get("/")
def running():
    return {
        "detail":"server running"
    }