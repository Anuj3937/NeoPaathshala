from fastapi import FastAPI
from pydantic import BaseModel
from agents import prompt_parser, culture_agent, mapper_agent,enricher_agent
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from task import dispatch_generation
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
from flow import generate_and_store_content ,run_agent ,geoip,extract_json_from_response,sessions
load_dotenv()
import os
# ---------- App Setup ----------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        # 1. Get all lessons for this user on this date
        cursor.execute("""
            SELECT * FROM lesson_plans
            WHERE user_id = %s AND date >= %s
            ORDER BY date
        """, (data.user_id, holiday_date))
        lessons = cursor.fetchall()
        # print(lessons)
        # 2. For each lesson, find next working day and update
        for i,lesson in enumerate(lessons):
            print(f"lesson {i}/{len(lessons)}")
            current_date = holiday_date
            next_working_date = get_next_working_day(current_date)
            print(next_working_date)
            cursor.execute("""
                UPDATE lesson_plans
                SET date = %s
                WHERE id = %s
            """, (next_working_date, lesson['id']))
            print(f"{len(lessons)} lessons moved from {holiday_date} to next working day.")
            conn.commit()
        return {"message": f"{len(lessons)} lessons moved from {holiday_date} to next working day."}

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
        print(results)
        return {"lesson_plans": results}

    except Exception as e:
        return {"error": str(e)}  # <-- temporarily return error message in response

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------- Request Schema ----------
class PromptRequest(BaseModel):
    prompt: str

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
    # 2️⃣ Always Run Culture Agent
    culture_prompt = f"For the location of :{location} stick to this for the google search for the topic:{topic}"
    culture_str = run_agent(culture_agent, sess.user_id, sess.id, culture_prompt)
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
        except json.JSONDecodeError:
            print("Grade mapper agent returned invalid JSON")
    print(grade_levels)
    content = defaultdict(dict)  # grade -> { content_type -> content }
    for grade in grade_levels:
        for ty in content_types:
            builder_prompt = f"Grade Level:{grade}\n{mapping_prompt}\nContent Type:{ty}"
            enriched_prompt = run_agent(enricher_agent,sess.user_id,sess.id,builder_prompt)
            # print(f"Prompt for grade {grade} and content type :{ty} :\n{enriched_prompt}")
            content[grade][ty] = generate_and_store_content(grade,ty,enriched_prompt,sess.user_id,sess.id)
    return {
        "topic": topic,
        "grade_levels": grade_levels,
        "content_types": content_types,
        "cultural_refs": cultural_refs,
        "generated_content": content
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

@app.get("/")
def running():
    return {
        "detail":"server running"
    }