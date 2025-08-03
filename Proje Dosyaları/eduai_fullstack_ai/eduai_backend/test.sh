#!/bin/bash
set -e
DB_FILE="$(dirname "$0")/eduai.db"
if [ -f "$DB_FILE" ]; then
  rm "$DB_FILE"
fi
# Ensure the parent directory of eduai_backend is on PYTHONPATH so that
# uvicorn can import the package. Without this, running the script
# directly from eduai_backend will cause ModuleNotFoundError.
PYTHONPATH="$(dirname "$0")/.." uvicorn eduai_backend.main:app --host 127.0.0.1 --port 8000 --log-level warning &
SERVER_PID=$!
# Wait for server to start
sleep 2
# Register user
echo "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password":"secret"}' http://127.0.0.1:8000/register)
echo "Register response: $REGISTER_RESPONSE"
TOKEN=$(echo $REGISTER_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
# Login user
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"secret"}' http://127.0.0.1:8000/token)
echo "Login response: $LOGIN_RESPONSE"
# List exams
echo "Listing exams..."
EXAMS=$(curl -s http://127.0.0.1:8000/exams)
echo "Exams: $EXAMS"
# Select exam
echo "Selecting exam..."
curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"exam_id":1}' http://127.0.0.1:8000/select_exam
# Questionnaire
echo "Sending questionnaire..."
curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"learning_style":"visual","daily_hours":3,"difficult_topics":["Fonksiyonlar"]}' http://127.0.0.1:8000/questionnaire
# Get mini test
echo "Getting mini test..."
MINI_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/mini_test)
echo "Mini test: $MINI_TEST"
# Submit mini test with correct answers
echo "Submitting mini test..."
EVAL=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"answers":[{"id":1,"answer":"3"},{"id":2,"answer":"4"},{"id":3,"answer":"5"},{"id":4,"answer":"6"},{"id":5,"answer":"7"}]}' http://127.0.0.1:8000/mini_test)
echo "Evaluation: $EVAL"
# Get weekly plan
echo "Getting weekly plan..."
PLAN=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/weekly_plan)
echo "Weekly plan: $PLAN"
# Get profile
echo "Getting profile..."
PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/profile)
echo "Profile: $PROFILE"
# Get progress
echo "Getting progress..."
PROGRESS=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/progress)
echo "Progress: $PROGRESS"
# Get AI history
echo "Getting AI history..."
HISTORY=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/ai_history?limit=5)
echo "AI history: $HISTORY"
# List plans
echo "Listing plans..."
PLANS=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/plans)
echo "Plans: $PLANS"
# Delete first plan (assume ID 1 for demo)
echo "Deleting plan ID 1..."
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/plans/1
# Kill server
kill $SERVER_PID
