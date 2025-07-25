from celery_app import celery
from flow import generate_and_store_content,run_agent,sessions
from agents import topics_agent ,ctypa,enricher_agent
import json
from collections import defaultdict
from datetime import timedelta
from itertools import cycle
import psycopg2
from dotenv import load_dotenv
import os
load_dotenv()
PASSWORD = os.getenv("SUPPABASE_PWD")
# Replace [YOUR-PASSWORD] with your actual password
conn = psycopg2.connect(
    host="aws-0-ap-south-1.pooler.supabase.com",
    database="postgres",
    user="postgres.tzcnbvcxnvwunzhopton",
    password=f"{PASSWORD}",
    port="6543"
)
async def session_start():
    return await sessions.create_session(app_name ="neo",user_id="1234")

# @celery.task
async def generate_topics_task(subject, grade,session_id,user_id):
    prompt = f"List lesson topics for grade {grade} {subject}"
    topics_str = run_agent(topics_agent, user_id,session_id, prompt)
    try:
        topics = json.loads(topics_str)
        print("Extracted Topics:", topics)
    except ValueError as e:
        print("Failed to parse JSON:", e)

    return topics['topics']

# @celery.task
async def generate_content_types(subject,grade,topic,session_id,user_id):
    prompt = f"Generate content types for the following Grade :{grade} , Subject:{subject} and topic being:{topic}"
    content_str = run_agent(ctypa, user_id,session_id, prompt)
    try:
        content_types = json.loads(content_str)
        print("Extracted contents:", content_types['types'])
    except ValueError as e:
        print("Failed to parse JSON:", e)
    return content_types['types']

# @celery.task
import math
from itertools import cycle

def save_content_to_db(gen_cont, subject, grade, lesson_dates, user_id):
    """
    Saves generated content to the DB, smartly spreading it over dates.
    """
    cursor = conn.cursor()
    lessons = []
    for topic, content_types in gen_cont.items():
        for c_type, content in content_types.items():
            lessons.append({
                "topic": topic,
                "type": c_type,
                "content": content
            })

    total_lessons = len(lessons)
    total_days = len(lesson_dates)

    if total_lessons == 0 or total_days == 0:
        print("No lessons or dates to save. Exiting.")
        cursor.close()
        # Do not close conn here if it's managed externally
        return

    records = []

    # Case 1: More lessons than days (or equal lessons to days)
    if total_lessons >= total_days:
        per_day = total_lessons // total_days
        extra = total_lessons % total_days
        lesson_index = 0

        for day in lesson_dates:
            num_lessons_today = per_day + (1 if extra > 0 else 0)
            if extra > 0:
                extra -= 1

            for _ in range(num_lessons_today):
                if lesson_index < total_lessons:
                    lesson = lessons[lesson_index]
                    records.append({
                        "date": day,
                        "lesson_content": lesson["content"],
                        "lesson_grade": grade,
                        "lesson_subject": subject,
                        "lesson_type": lesson["type"],
                        "user_id": user_id
                    })
                    lesson_index += 1
                else:
                    break # All lessons have been assigned

    # Case 2: More days than lessons
    else:
        # Distribute lessons as evenly as possible across the days
        # This will assign one lesson per step, skipping days if step > 1
        step = total_days / total_lessons # Using float division for more granular distribution
        day_index_float = 0

        for lesson in lessons:
            assigned_date_index = math.floor(day_index_float)
            if assigned_date_index >= total_days:
                # This can happen if step is very small and we reach the end
                assigned_date_index = total_days - 1
            assigned_date = lesson_dates[assigned_date_index]

            records.append({
                "date": assigned_date,
                "lesson_content": lesson["content"],
                "lesson_grade": grade,
                "lesson_subject": subject,
                "lesson_type": lesson["type"],
                "user_id": user_id
            })
            day_index_float += step

    # Prepare records for insertion
    # Convert list of dictionaries to list of tuples for cursor.execute
    records_to_insert = []
    for record in records:
        records_to_insert.append((
            record["date"],
            record["lesson_content"],
            record["lesson_grade"],
            record["lesson_subject"],
            record["lesson_type"],
            record["user_id"]
        ))

    # Insert into Supabase DB
    # Use executemany for efficiency if the database driver supports it
    # Otherwise, iterate and execute
    try:
        if records_to_insert: # Only execute if there are records
            # It's better to use executemany for multiple insertions
            # Check your database driver's documentation for exact usage of executemany
            # If your driver doesn't support executemany with a list of tuples for multiple rows,
            # you will need to iterate as you did, but with proper value formatting.

            # Example using executemany (common for psycopg2, mysql.connector etc.):
            sql_insert_query = """
                INSERT INTO lesson_plans (
                    date, lesson_content, lesson_grade, lesson_subject,
                    lesson_type, user_id
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.executemany(sql_insert_query, records_to_insert)
            conn.commit()
            print(f"{len(records_to_insert)} lesson plans inserted into Supabase.")
        else:
            print("No records generated for insertion.")

    except Exception as e:
        conn.rollback() # Rollback in case of error
        print(f"Error inserting records: {e}")
    finally:
        cursor.close()
        # Do not close conn here if it's managed externally,
        # otherwise, uncomment conn.close() if this function is responsible for it.
        # conn.close()

from datetime import timedelta, datetime

def compute_lesson_dates(start_date,end_date,saturdays_working,second_saturday_off):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    saturdays_working = saturdays_working
    second_off = second_saturday_off
    lessons, sat_count = [], 0
    current = start
    while current <= end:
        if current.weekday() == 5:  # Saturday
            sat_count += 1
            if not saturdays_working or (second_off and sat_count % 2 == 0):
                current += timedelta(days=1); continue
        lessons.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return lessons

# @celery.task
async def dispatch_generation(subjects, grades,start_date,end_date,saturdays_working,second_saturday_off):
    tasks = []
    gen_cont = defaultdict(dict)
    sess = await session_start()
    session_id,user_id = sess.id , sess.user_id
    lessons = compute_lesson_dates(start_date,end_date,saturdays_working,second_saturday_off)
    for subject in subjects:
        for grade in grades:
            topics = await generate_topics_task(subject=subject, grade=grade,session_id=session_id,user_id=user_id)
            for topic in topics:
                content_types = await generate_content_types(subject=subject,grade=grade,topic=topic,session_id=session_id,user_id=user_id)
                for c_type in content_types:
                    prompt = f"For Grade level : {grade} , subject:{subject} , topic being {topic} and content type {c_type}"
                    enriched_prompt = run_agent(enricher_agent,sess.user_id,sess.id,prompt)
                    content  = generate_and_store_content(grade_level=grade,content_type=c_type,prompt=enriched_prompt,session_id=session_id,user_id=user_id)
                    gen_cont[topic][c_type] = content
        save_content_to_db(gen_cont=gen_cont,subject=subject,grade=grade,lesson_dates=lessons,user_id=user_id)
    return "Content Generated"
    # return celery.group(tasks).apply_async()