"""
AI service integration module for EduAI.

This module wraps calls to Google's Gemini (Generative AI) API to power
personalised features such as mini test generation, weekly plan creation
and open chat interactions. If the remote API is unavailable or JSON
parsing fails, fallback logic from ``ai_stub.py`` is used to ensure
responses are always returned. The API key is read from the environment
variable ``GEMINI_API_KEY``; if not set, a default value is used.

Note: This file deliberately avoids printing or logging the API key to
prevent accidental leaks. Any errors from the Gemini service are caught
and handled gracefully.
"""

from __future__ import annotations

import os
import json
from datetime import date, timedelta
from typing import List, Dict, Any, Optional

import requests

from . import ai_stub

# Read the API key from the environment, fallback to a provided default
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDnqbWBN0ga9zVl1YBbiWvroZHPx6fg5Ho")

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def _call_gemini(prompt: str) -> Optional[str]:
    """Call the Gemini API with a free‑form prompt and return the first candidate text.

    If the request fails or the response structure is unexpected, None
    is returned. This low‑level helper encapsulates the HTTP call and
    avoids exposing the API key via logs.
    """
    url = f"{BASE_URL}?key={API_KEY}"
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ]
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        # The API returns a list of candidates; each candidate has a content with parts
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


def generate_mini_test(
    exam_names: Optional[List[str]] = None,
    difficult_topics: Optional[List[str]] = None,
    num_questions: int = 5,
) -> List[Dict[str, Any]]:
    """Generate a mini test using Gemini.

    :param exam_names: List of exam names (e.g. ["TYT", "AYT"]). If None,
        questions will be general.
    :param difficult_topics: List of topics the user struggles with.
    :param num_questions: Number of questions to generate.
    :returns: A list of question dictionaries with id, prompt, choices and answer.
    """
    # Build a prompt describing the desired question set
    exam_part = (
        f"for the {', '.join(exam_names)} exam(s) " if exam_names else ""
    )
    difficulty_part = (
        f" focusing on {', '.join(difficult_topics)} topics" if difficult_topics else ""
    )
    prompt = (
        f"Generate {num_questions} multiple‑choice questions {exam_part}{difficulty_part}. "
        "For each question provide exactly 4 answer options and identify the correct answer. "
        "Respond with a JSON array where each element has the keys 'id' (int), 'prompt' (string), "
        "'choices' (array of 4 strings) and 'answer' (string equal to one of the choices). "
        "Only provide the JSON array and no additional commentary."
    )
    response = _call_gemini(prompt)
    if response:
        try:
            questions = json.loads(response)
            # Validate structure
            if isinstance(questions, list) and all(
                isinstance(q, dict)
                and "id" in q
                and "prompt" in q
                and "choices" in q
                and "answer" in q
                for q in questions
            ):
                return questions
        except Exception:
            pass
    # Fallback to stub if API call fails or JSON invalid
    return ai_stub.generate_mini_test(user_id=0, num_questions=num_questions)


def generate_weekly_plan(
    exam_names: Optional[List[str]] = None,
    difficult_topics: Optional[List[str]] = None,
    week_start: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a weekly study plan using Gemini.

    :param exam_names: List of exams the user targets.
    :param difficult_topics: Topics the user struggles with.
    :param week_start: ISO date string for the week start. If None, Monday of the current week is used.
    :returns: A plan dict with keys week_start, subjects and tests.
    """
    # Determine week_start if not provided
    if not week_start:
        today = date.today()
        week_monday = today - timedelta(days=today.weekday())
        week_start = week_monday.isoformat()
    exam_part = (
        f"for the {', '.join(exam_names)} exam(s) " if exam_names else ""
    )
    difficulty_part = (
        f" The student struggles with {', '.join(difficult_topics)}." if difficult_topics else ""
    )
    prompt = (
        f"Create a weekly study plan {exam_part}beginning on {week_start}."
        f"{difficulty_part} The plan should use the keys 'week_start' (string), "
        "'subjects' (an array of objects with 'day' (string), 'topic' (string), 'duration' (int hours)), "
        "and 'tests' (an array of objects with 'day' (string), 'subject' (string), 'num_questions' (int)). "
        "Return only the JSON object with these keys and no additional commentary."
    )
    response = _call_gemini(prompt)
    if response:
        try:
            plan = json.loads(response)
            # Validate structure
            if (
                isinstance(plan, dict)
                and "week_start" in plan
                and isinstance(plan.get("subjects"), list)
            ):
                return plan
        except Exception:
            pass
    # Fallback to stub if API fails
    return ai_stub.generate_weekly_plan(user_id=0, week_start=week_start)


def chat_reply(message: str) -> str:
    """Obtain a conversational reply from Gemini.

    This function sends the user's message to Gemini with a system prompt
    instructing it to act as a friendly tutor. If the API call fails,
    a default response is returned.
    """
    system_prompt = (
        "You are a helpful, patient educational tutor. Answer the user's question "
        "clearly and concisely, and offer guidance or explanations where needed."
    )
    prompt = f"{system_prompt}\nUser: {message}\nTutor:"
    response = _call_gemini(prompt)
    if response:
        return response.strip()
    return "Maalesef şu anda sorunuza yanıt veremiyorum. Lütfen tekrar deneyin."