from datetime import datetime, timedelta
from typing import List, Dict, Any


def generate_mini_test(user_id: int, num_questions: int = 5) -> List[Dict[str, Any]]:
    """
    Gerçek AI yerine türev ve limit konularında sabit sorular üretir.
    """
    questions = [
        {
            "id": 1,
            "prompt": "lim(x→2) (x^2 - 4)/(x - 2) limitinin sonucu nedir?",
            "choices": ["2", "3", "4", "5"],
            "answer": "4"
        },
        {
            "id": 2,
            "prompt": "f(x) = x^3 fonksiyonunun x=1 noktasındaki türevi nedir?",
            "choices": ["1", "2", "3", "4"],
            "answer": "3"
        },
        {
            "id": 3,
            "prompt": "lim(x→0) (sinx)/x limitinin sonucu nedir?",
            "choices": ["0", "1", "∞", "Tanımsız"],
            "answer": "1"
        },
        {
            "id": 4,
            "prompt": "f(x) = x^2 + 3x fonksiyonunun türevi nedir?",
            "choices": ["2x + 3", "x + 3", "2x + 1", "3x^2"],
            "answer": "2x + 3"
        },
        {
            "id": 5,
            "prompt": "lim(x→∞) (3x^2 + 2)/(x^2 + 5) limitinin sonucu nedir?",
            "choices": ["1", "2", "3", "∞"],
            "answer": "3"
        }
    ]
    return questions[:num_questions]


def evaluate_mini_test(answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Kullanıcının cevaplarını değerlendirir.
    """
    correct_answers = {str(q["id"]): q["answer"] for q in generate_mini_test(user_id=0)}
    results = []
    correct_count = 0

    for ans in answers:
        q_id = str(ans.get("id"))
        user_ans = ans.get("answer")
        correct = correct_answers.get(q_id)
        is_correct = (user_ans == correct)
        if is_correct:
            correct_count += 1
        results.append({
            "id": q_id,
            "correct": is_correct,
            "correct_answer": correct,
            "your_answer": user_ans
        })

    return {
        "total": len(answers),
        "correct": correct_count,
        "details": results
    }