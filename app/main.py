from fastapi import FastAPI, Request, HTTPException # Added Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
from agents import prompt_parser, culture_agent, mapper_agent,enricher_agent ,syllabus_agent ,story_breaker_agent
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from task import dispatch_generation
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
from flow import generate_and_store_content ,run_agent ,geoip,extract_json_from_response,sessions,generate_image_base64
load_dotenv()
import os
from elevenlabs.client import ElevenLabs
from typing import Dict, List
from datetime import date
# ---------- App Setup ----------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")
)
# --- OAuth Setup ---
oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    client_kwargs={'scope': 'email openid profile'}
)

# --- Auth Routes ---
@app.get('/login')
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/auth', name='auth') # named the route
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        request.session['user'] = token.get('userinfo')
    except Exception as e:
        return RedirectResponse(url='http://localhost:3000?error=auth_failed')
    return RedirectResponse(url='http://localhost:3000/')

@app.get('/api/me')
async def get_current_user(request: Request):
    user = request.session.get('user')
    if user:
        print(user)
        return {"logged_in": True, "user": user}
    return {"logged_in": False}

@app.get('/logout')
async def logout(request: Request):
    request.session.pop('user', None)
    return {"message": "Logged out successfully"}

ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVEN_API_KEY:
    raise RuntimeError("Missing ElevenLabs API key")

client = ElevenLabs(api_key=ELEVEN_API_KEY)


PASSWORD = os.getenv("SUPPABASE_PWD")
# Reuse DB connection function
def get_db_connection():
    return psycopg2.connect(
    host="aws-0-ap-south-1.pooler.supabase.com",
    database="postgres",
    user="postgres.tzcnbvcxnvwunzhopton",
    password=f"{PASSWORD}",
    port="6543"
)

from datetime import datetime, timedelta

class HolidayRequest(BaseModel):
    date: str  # format: YYYY-MM-DD
    user_id: str

def get_next_working_day(start_date: datetime):
    next_day = start_date + timedelta(days=1)
    print("started")
    while next_day.weekday() == 6 or next_day.weekday() == 5:
        next_day += timedelta(days=1)
    print("ended")
    return next_day

from datetime import datetime, timedelta

@app.put("/lesson-plans/{lesson_id}/push-tomorrow")
async def push_lesson_tomorrow(lesson_id: str):
    print("Running",lesson_id)
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        print("exec")
        cursor.execute("""SELECT date FROM lesson_plans WHERE id = ?""", (lesson_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lesson not found")
        print(row[0])
        current_date = row[0]
        print("getting working day")
        new_date = get_next_working_day(current_date)
        print(f"moving from {row[0]} to {new_date}")
        cursor.execute("UPDATE lesson_plans SET date = ? WHERE id = ?", (new_date, lesson_id))
        conn.commit()

        return {"message": f"Lesson pushed to {new_date}"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()


@app.delete("/lesson-plans/{lesson_id}")
async def delete_lesson(lesson_id: str):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
         # 1. Get all lessons for this user on this date
        cursor.execute("""DELETE FROM lesson_plans WHERE lesson_id = ?""", (lesson_id,))
        conn.commit()
        return {"message": "Lesson deleted successfully"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()

@app.put("/mark-holiday")
async def mark_holiday(data: HolidayRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        holiday_date = datetime.strptime(data.date, "%Y-%m-%d").date()
        print("triggered")

        # 1. Get all lessons for this user on or after this date, ordered by date
        cursor.execute("""
            SELECT id, date, topic FROM lesson_plans
            WHERE user_id = %s AND date >= %s
            ORDER BY date ASC, id ASC
        """, (data.user_id, holiday_date))
        lessons_to_shift = cursor.fetchall()

        if not lessons_to_shift:
            return {"message": f"No lessons found on or after {holiday_date} for user {data.user_id}."}

        # 2. Group lessons by their original date
        lessons_by_original_date: Dict[date, List[Dict]] = defaultdict(list)
        for lesson in lessons_to_shift:
            lessons_by_original_date[lesson['date']].append(lesson)

        # Get unique original dates, sorted
        sorted_original_dates = sorted(lessons_by_original_date.keys())

        # Keep track of the last date that has been assigned to a group of lessons
        # Initialize it to the day *before* the holiday, so the first shift correctly moves past the holiday.
        last_assigned_date = holiday_date - timedelta(days=1)

        # Set to keep track of all dates that are now occupied by shifted lessons (including the holiday itself)
        # This is crucial for `get_next_working_day` to find truly available slots
        # all_occupied_dates: Set[date] = {holiday_date}

        total_lessons_moved = 0
        updates_to_execute = [] # Store all updates to commit at once

        for original_date in sorted_original_dates:
            lessons_in_group = lessons_by_original_date[original_date]

            # The new date for this group must be after the last assigned date
            # and also not the holiday itself, and not a weekend.
            
            # Start checking from the day after the maximum of (original_date, last_assigned_date)
            # This ensures cascading: if a previous group pushed dates far out, this group starts from there.
            # If this group's original date is naturally later, it starts from its original date.
            check_from_date = max(original_date, last_assigned_date)

            # Find the next available working day for this group
            new_date_for_group = get_next_working_day(check_from_date)

            # If the original_date itself was the holiday, ensure it moves at least one day past it.
            # This handles the specific case where original_date == holiday_date
            if original_date == holiday_date:
                # The `get_next_working_day` already handles `holiday_date` being in `all_occupied_dates`
                pass # No special adjustment needed here if get_next_working_day is robust

            # Add the new date for this group to the set of all occupied dates
            # all_occupied_dates.add(new_date_for_group)
            last_assigned_date = new_date_for_group # Update the last assigned date for the next iteration

            # Prepare updates for all lessons in this group
            for lesson in lessons_in_group:
                if lesson['date'] != new_date_for_group: # Only update if date actually changes

                    updates_to_execute.append((new_date_for_group, lesson['id']))
                    total_lessons_moved += 1
                    print(f"Lesson ID {lesson['id']} moved from {lesson['date']} to {new_date_for_group}.")

        # 3. Execute all updates in a single transaction
        for new_date, lesson_id in updates_to_execute:
            print(lesson_id,new_date)
        #     cursor.execute("""
        #         UPDATE lesson_plans
        #         SET date = %s
        #         WHERE id = %s
        #     """, (new_date, lesson_id))
        
        # conn.commit() # Commit all changes

        return {"message": f"{total_lessons_moved} lessons moved due to holiday on {holiday_date}."}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()

@app.get("/lesson-plans/{user_id}")
async def get_lesson_plans(user_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT date, lesson_content, lesson_grade, lesson_subject,
                   lesson_type, user_id
            FROM lesson_plans
            WHERE user_id = %s
            ORDER BY date ASC
            """,
            (user_id,)
        )
        results = cursor.fetchall()
        return {"lesson_plans": results}

    except Exception as e:
        return {"error": str(e)}  # <-- temporarily return error message in response

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------- Request Schema ----------
class PromptRequest(BaseModel):
    prompt: str
    selected_language: str # <--- ADD THIS LINE

# ---------- Endpoint ----------
@app.post("/parse_and_map/")
async def parse_and_map(req: PromptRequest):
    prompt = req.prompt
    selected_language = req.selected_language 
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
    # 2️⃣ Always Run Culture Agent
    culture_prompt = f"For the location of :{location} stick to this for the google search for the topic:{topic}"
    culture_str = run_agent(culture_agent, sess.user_id, sess.id, culture_prompt)
    cultural_refs = ""
    try:
        parsed_json = extract_json_from_response(culture_str)
        cultural_refs = parsed_json["cultural_refs"]
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
                print(grade_levels)
        except json.JSONDecodeError:
            print("Grade mapper agent returned invalid JSON")
    print(grade_levels)
    content = defaultdict(dict)  # grade -> { content_type -> content }
    for grade in grade_levels:
        syllabus_prompt = f"For the BOARD of :CBSE stick to this for the google search for this topic:{topic} and this grade level:{grade}"
        syllabus_str = run_agent(syllabus_agent, sess.user_id, sess.id, syllabus_prompt)
        try:
            parsed_json = extract_json_from_response(syllabus_str)
            cultural_refs = parsed_json["cultural_refs"]
        except ValueError as e:
            print("Failed to parse  culture JSON:", e)
        print(syllabus_str)
        for ty in content_types:
            builder_prompt = f"Grade Level:{grade}\n{mapping_prompt}\nContent Type:{ty} and also mention the content to be generated in this language: {selected_language}"
            enriched_prompt = run_agent(enricher_agent,sess.user_id,sess.id,builder_prompt)
            # print(f"Prompt for grade {grade} and content type :{ty} :\n{enriched_prompt}")
            content[grade][ty] = generate_and_store_content(grade,ty,enriched_prompt,sess.user_id,sess.id)
    return {
        "topic": topic,
        "grade_levels": grade_levels,
        "content_types": content_types,
        "cultural_refs": cultural_refs,
        "generated_content": content,
        "language":selected_language
    }

class LessonPlanRequest(BaseModel):
    subjects: List[str]
    grades: List[str]
    start_date: str
    end_date: str
    saturdays_working: bool
    second_saturday_off: bool

@app.post("/generate-lesson-plans")
async def start_plans(form: LessonPlanRequest):
    # returns task ID of dispatch
    task = await dispatch_generation(form.subjects, form.grades, form.start_date,form.end_date,form.saturdays_working,form.second_saturday_off)
    return {"task_id": task}

class StoryToVisualRequest(BaseModel):
    story_text: str
    # You might want to include context like topic, grade, language for better image generation
    topic: str
    grade_level: str
    selected_language: str

import base64
from fastapi import HTTPException

def generate_tts_base64(texts: list[str], voice_id: str, model_id: str, output_format: str) -> list[str]:
    audio_list = []
    for text in texts:
        try:
            audio_bytes = client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                output_format=output_format,
            )
            audio_bytes_chunks = []
            for chunk in audio_bytes:
                # print(chunk)
                audio_bytes_chunks.append(chunk)
            audio_bytes = b"".join(audio_bytes_chunks)
            encoded = base64.b64encode(audio_bytes).decode("utf-8")
            audio_list.append(f"data:audio/{output_format};base64,{encoded}")
        except Exception as e:  
            print(e)
            raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
    return audio_list


@app.post("/generate_visual_story/")
async def break_story_into_visual_segments(req: StoryToVisualRequest):
    """
    Breaks down a story into an array of image generation prompts and
    corresponding narration segments.   
    """
    sess = await sessions.create_session(app_name ="neo",user_id="1234")
    raw_story_text = req.story_text
    topic = req.topic
    grade_level = req.grade_level
    language = req.selected_language
    breaker_prompt = f"Break the following story:{raw_story_text} as instructed and for reference here is the topic:{topic},grade_level:{grade_level},and language:{language}"
    story_str = run_agent(story_breaker_agent,sess.user_id, sess.id,breaker_prompt)
    try:
        story_parts = json.loads(story_str)
        narration_segments = story_parts.get('narration', [])
        image_prompts = story_parts.get('image_prompt', [])
        print(len(image_prompts),len(narration_segments))
    except ValueError as e:
        raise HTTPException(status_code=500, detail="Failed to parse JSON from story breaker agent.")

    # Call TTS
    audio_segments = generate_tts_base64(
        texts=narration_segments,
        voice_id="nPczCjzI2devNBz1zQrb",
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128"
    )
    # print(audio_segments)
    # Call Image generation
    generated_image_segments_raw = [generate_image_base64(prompt) for prompt in image_prompts]
    # print(generated_image_segments_raw)
    # --- LOGIC TO REPEAT LAST IMAGE IF NECESSARY ---
    final_image_segments = []
    if generated_image_segments_raw: # Ensure there's at least one image to repeat
        last_image = generated_image_segments_raw[-1]
        for i in range(len(narration_segments)):
            if i < len(generated_image_segments_raw):
                final_image_segments.append(generated_image_segments_raw[i])
            else:
                final_image_segments.append(last_image)
    else:
        # If no images were generated at all, provide a placeholder or raise an error
        # For now, let's just append None or an empty string, you might want a default placeholder image
        final_image_segments = [None] * len(narration_segments)
        # Or you could raise an error:
        # raise HTTPException(status_code=500, detail="No images were generated for the story.")
    # --- END OF LOGIC ---

    # Ensure audio_segments has the same length as narration_segments
    # This is typically handled by generate_tts_base64, but an explicit check is good
    if len(audio_segments) != len(narration_segments):
        print(f"Warning: Audio segments ({len(audio_segments)}) and narration segments ({len(narration_segments)}) length mismatch.")
        # Decide how to handle this: truncate, pad, or raise error.
        # For simplicity, we'll assume generate_tts_base64 always matches input length.
        # If not, you'd need similar padding logic here.

    return {
        "metadata": {
            "topic": req.topic,
            "grade_level": req.grade_level,
            "language": req.selected_language
        },
        "segments": [
            {
                "narration_text": narration_segments[i],
                "audio_base64": audio_segments[i],
                "image_prompt": image_prompts[i] if i < len(image_prompts) else "Repeated prompt for visual continuity", # Provide a sensible prompt for repeated images
                "image_base64": final_image_segments[i]
            }
            for i in range(len(narration_segments))
        ]
    }


@app.get("/")
def running():
    return {    
        "detail":"server running"
    }