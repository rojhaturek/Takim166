"""
Main application for the EduAI backend.

This FastAPI app demonstrates a simplified version of the backend described in
the project specification. It supports user registration, authentication via
JWT, exam selection, a questionnaire, mini test generation/evaluation and
weekly plan creation. Real AI integration and dynamic curriculum planning
would require external APIs and complex logic, which are stubbed here.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware

from . import database, auth, schemas, ai_service, ai_stub
import re
import json


# Initialise database and seed exam types on import
database.init_db()
database.seed_exam_types()

app = FastAPI(title="EduAI Backend")

# Allow all CORS origins for demonstration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register", response_model=auth.Token)
def register(user: schemas.UserCreate):
    """Register a new user and return an access token."""
    # Very simple email validation using regex
    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(email_regex, user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    # Check if email already exists
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if cur.fetchone() is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        hashed = auth.hash_password(user.password)
        cur.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (user.name, user.email, hashed),
        )
        conn.commit()
        user_id = cur.lastrowid
    # create token
    payload = {
        "sub": user_id,
        "exp": int((datetime.utcnow() + timedelta(seconds=auth.ACCESS_TOKEN_EXPIRE_SECONDS)).timestamp()),
    }
    token = auth.create_access_token(payload)
    return auth.Token(access_token=token)


@app.get("/profile", response_model=schemas.UserProfileResponse)
def get_profile(user_id: int = Depends(auth.get_current_user)):
    """Return the current user's profile, including selected exams and last questionnaire."""
    with database.get_db() as conn:
        cur = conn.cursor()
        # Fetch user
        cur.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user_profile = {"id": row["id"], "name": row["name"], "email": row["email"], "exams": [], "questionnaire": None}
        # Fetch exams
        cur.execute(
            "SELECT et.name FROM exam_types et JOIN user_exams ue ON et.id = ue.exam_id WHERE ue.user_id = ?",
            (user_id,),
        )
        user_profile["exams"] = [r["name"] for r in cur.fetchall()]
        # Fetch last questionnaire if exists
        cur.execute(
            "SELECT content FROM ai_interactions WHERE user_id = ? AND interaction_type = 'questionnaire' ORDER BY timestamp DESC LIMIT 1",
            (user_id,),
        )
        qrow = cur.fetchone()
        if qrow is not None and qrow["content"]:
            try:
                user_profile["questionnaire"] = json.loads(qrow["content"])
            except Exception:
                user_profile["questionnaire"] = None
    return schemas.UserProfileResponse(**user_profile)


@app.post("/token", response_model=auth.Token)
def login(form_data: schemas.UserLogin):
    """Authenticate user and return an access token."""
    user_id = auth.authenticate_user(form_data.email, form_data.password)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    payload = {
        "sub": user_id,
        "exp": int((datetime.utcnow() + timedelta(seconds=auth.ACCESS_TOKEN_EXPIRE_SECONDS)).timestamp()),
    }
    token = auth.create_access_token(payload)
    return auth.Token(access_token=token)


@app.get("/exams", response_model=List[Dict[str, Any]])
def list_exams():
    """Return available exam types."""
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM exam_types")
        exams = [dict(row) for row in cur.fetchall()]
    return exams


@app.post("/select_exam", status_code=status.HTTP_204_NO_CONTENT)
def select_exam(selection: schemas.ExamSelection, user_id: int = Depends(auth.get_current_user)):
    """Associate a user with an exam type."""
    # Ensure exam exists
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM exam_types WHERE id = ?", (selection.exam_id,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        # Allow multiple exam selections by inserting ignore duplicate
        cur.execute(
            "INSERT OR IGNORE INTO user_exams (user_id, exam_id) VALUES (?, ?)",
            (user_id, selection.exam_id),
        )
        conn.commit()
    return


@app.post("/questionnaire", status_code=status.HTTP_204_NO_CONTENT)
def questionnaire(questionnaire: schemas.Questionnaire, user_id: int = Depends(auth.get_current_user)):
    """Store user questionnaire responses as an AI interaction."""
    # Save questionnaire to AI interactions
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ai_interactions (user_id, interaction_type, content, result) VALUES (?, ?, ?, ?)",
            (user_id, "questionnaire", questionnaire.json(), None),
        )
        conn.commit()
    return


@app.get("/mini_test", response_model=schemas.MiniTestResponse)
def get_mini_test(user_id: int = Depends(auth.get_current_user)):
    """Generate a personalised mini test for the current user using AI."""
    # Gather context for AI: exam names and difficult topics from last questionnaire
    exam_names: List[str] = []
    difficult_topics: Optional[List[str]] = None
    with database.get_db() as conn:
        cur = conn.cursor()
        # Fetch exam names associated with user
        cur.execute(
            "SELECT et.name FROM exam_types et JOIN user_exams ue ON et.id = ue.exam_id WHERE ue.user_id = ?",
            (user_id,),
        )
        exam_names = [row["name"] for row in cur.fetchall()]
        # Fetch latest questionnaire and parse difficult topics
        cur.execute(
            "SELECT content FROM ai_interactions WHERE user_id = ? AND interaction_type = 'questionnaire' ORDER BY timestamp DESC LIMIT 1",
            (user_id,),
        )
        qrow = cur.fetchone()
        if qrow and qrow["content"]:
            try:
                qdata = json.loads(qrow["content"])
                if isinstance(qdata, dict) and qdata.get("difficult_topics"):
                    difficult_topics = qdata.get("difficult_topics")
            except Exception:
                difficult_topics = None
    # Request AI to generate questions
    questions = ai_service.generate_mini_test(
        exam_names=exam_names or None,
        difficult_topics=difficult_topics,
        num_questions=5,
    )
    # Record AI interaction with full set of questions (including answers)
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ai_interactions (user_id, interaction_type, content, result) VALUES (?, ?, ?, ?)",
            (user_id, "mini_test_generated", None, json.dumps(questions)),
        )
        conn.commit()
    # Hide correct answers when sending to client
    sanitized = [
        {k: v for k, v in q.items() if k != "answer"}
        for q in questions
    ]
    return schemas.MiniTestResponse(questions=sanitized)




@app.post("/mini_test", response_model=Dict[str, Any])
def post_mini_test(result: schemas.MiniTestResult, user_id: int = Depends(auth.get_current_user)):
    """Evaluate a mini test and save results."""
    evaluation = ai_stub.evaluate_mini_test(result.answers)
    # Save evaluation
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ai_interactions (user_id, interaction_type, content, result) VALUES (?, ?, ?, ?)",
            (user_id, "mini_test_completed", json.dumps(result.answers), json.dumps(evaluation)),
        )
        conn.commit()
    return evaluation


@app.get("/weekly_plan", response_model=schemas.WeeklyPlanResponse)
def get_weekly_plan(req: schemas.WeeklyPlanRequest = Depends(), user_id: int = Depends(auth.get_current_user)):
    """Generate a personalised weekly plan for the user and store it."""
    # Determine week start date for AI
    if req.week_start:
        week_start = req.week_start
    else:
        today = datetime.utcnow().date()
        week_start_date = today - timedelta(days=today.weekday())
        week_start = week_start_date.isoformat()
    # Fetch exam names and difficult topics similar to mini test
    exam_names: List[str] = []
    difficult_topics: Optional[List[str]] = None
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT et.name FROM exam_types et JOIN user_exams ue ON et.id = ue.exam_id WHERE ue.user_id = ?",
            (user_id,),
        )
        exam_names = [row["name"] for row in cur.fetchall()]
        cur.execute(
            "SELECT content FROM ai_interactions WHERE user_id = ? AND interaction_type = 'questionnaire' ORDER BY timestamp DESC LIMIT 1",
            (user_id,),
        )
        qrow = cur.fetchone()
        if qrow and qrow["content"]:
            try:
                qdata = json.loads(qrow["content"])
                if isinstance(qdata, dict) and qdata.get("difficult_topics"):
                    difficult_topics = qdata.get("difficult_topics")
            except Exception:
                difficult_topics = None
    plan = ai_service.generate_weekly_plan(
        exam_names=exam_names or None,
        difficult_topics=difficult_topics,
        week_start=week_start,
    )
    # Save plan to DB
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO weekly_plans (user_id, week_start, subjects, tests) VALUES (?, ?, ?, ?)",
            (
                user_id,
                plan["week_start"],
                json.dumps(plan.get("subjects", [])),
                json.dumps(plan.get("tests")),
            ),
        )
        conn.commit()
    return schemas.WeeklyPlanResponse(**plan)


@app.get("/progress", response_model=List[schemas.ProgressRecord])
def get_progress(user_id: int = Depends(auth.get_current_user)):
    """Return all progress records for the current user."""
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, topic, status, score FROM user_progress WHERE user_id = ? ORDER BY id",
            (user_id,),
        )
        records = [schemas.ProgressRecord(id=row["id"], topic=row["topic"], status=row["status"], score=row["score"]) for row in cur.fetchall()]
    return records


@app.get("/ai_history", response_model=List[schemas.AIInteractionRecord])
def get_ai_history(limit: int = Query(10, ge=1, le=100), user_id: int = Depends(auth.get_current_user)):
    """Return the latest AI interactions for the user."""
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, interaction_type, content, result, timestamp FROM ai_interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
            (user_id, limit),
        )
        interactions = []
        for row in cur.fetchall():
            # Convert JSON strings to dicts if present
            content = row["content"]
            result = row["result"]
            try:
                content_parsed = json.loads(content) if content else None
            except Exception:
                content_parsed = None
            try:
                result_parsed = json.loads(result) if result else None
            except Exception:
                result_parsed = None
            interactions.append(
                schemas.AIInteractionRecord(
                    id=row["id"],
                    interaction_type=row["interaction_type"],
                    content=content_parsed,
                    result=result_parsed,
                    timestamp=row["timestamp"],
                )
            )
    return interactions


@app.get("/plans", response_model=List[schemas.WeeklyPlanRecord])
def list_plans(user_id: int = Depends(auth.get_current_user)):
    """Return all weekly plans for the user."""
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, week_start, subjects, tests FROM weekly_plans WHERE user_id = ? ORDER BY id",
            (user_id,),
        )
        plans = []
        for row in cur.fetchall():
            try:
                subjects = json.loads(row["subjects"])
            except Exception:
                subjects = []
            try:
                tests = json.loads(row["tests"]) if row["tests"] else None
            except Exception:
                tests = None
            plans.append(
                schemas.WeeklyPlanRecord(
                    id=row["id"],
                    week_start=row["week_start"],
                    subjects=subjects,
                    tests=tests,
                )
            )
    return plans


@app.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, user_id: int = Depends(auth.get_current_user)):
    """Delete a weekly plan by ID."""
    with database.get_db() as conn:
        cur = conn.cursor()
        # Ensure plan belongs to user
        cur.execute("SELECT id FROM weekly_plans WHERE id = ? AND user_id = ?", (plan_id, user_id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
        cur.execute("DELETE FROM weekly_plans WHERE id = ?", (plan_id,))
        conn.commit()
    return


@app.post("/chat", response_model=Dict[str, str])
def chat(request: schemas.ChatRequest, user_id: int = Depends(auth.get_current_user)):
    """Return a conversational reply to the user's message using the AI service.

    The message is stored in the AI interactions table along with the AI's
    response so that the chat history can be retrieved via `/ai_history`.
    """
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")
    reply = ai_service.chat_reply(user_message)
    # Record interaction
    with database.get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ai_interactions (user_id, interaction_type, content, result) VALUES (?, ?, ?, ?)",
            (user_id, "chat", json.dumps({"message": user_message}), json.dumps({"reply": reply})),
        )
        conn.commit()
    return {"reply": reply}
