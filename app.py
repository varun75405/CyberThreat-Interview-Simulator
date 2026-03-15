from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from langchain_openai import ChatOpenAI

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    openai_api_key=GROQ_API_KEY,
    openai_api_base="https://api.groq.com/openai/v1",
    temperature=0.7,
    max_tokens=1024
)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "BVarun@2005",
    "database": "cybersec_db"
}

def get_db():
    return mysql.connector.connect(**db_config)


@app.route("/api/attacks", methods=["GET"])
def get_attacks():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT category_id, attack_name, mitre_id, mitre_tactic FROM categories")
    attacks = cursor.fetchall()
    conn.close()
    return jsonify(attacks)


@app.route("/api/generate-incident", methods=["POST"])
def generate_incident():
    data = request.json
    attack_type = data.get("attack_type")
    target_system = data.get("target_system")
    severity = data.get("severity")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT s.log_text, c.attack_name, c.mitre_id, c.mitre_tactic, c.category_id
        FROM scenarios s
        JOIN categories c ON s.category_id = c.category_id
        WHERE c.attack_name = %s AND s.severity = %s
        LIMIT 1
    """, (attack_type, severity.lower()))

    scenario = cursor.fetchone()
    conn.close()

    if scenario:
        return jsonify({
            "log": scenario["log_text"],
            "attack_name": scenario["attack_name"],
            "mitre_id": scenario["mitre_id"],
            "mitre_tactic": scenario["mitre_tactic"],
            "category_id": scenario["category_id"]
        })

    prompt = f"""Generate a realistic cybersecurity incident log for:
- Attack Type: {attack_type}
- Target System: {target_system}
- Severity: {severity}

Return 4-5 log lines with timestamps, IPs, and realistic indicators.
Keep it short and technical."""

    log_text = llm.invoke(prompt).content

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categories WHERE attack_name = %s", (attack_type,))
    cat = cursor.fetchone()
    conn.close()

    return jsonify({
        "log": log_text,
        "attack_name": cat["attack_name"] if cat else attack_type,
        "mitre_id": cat["mitre_id"] if cat else "T0000",
        "mitre_tactic": cat["mitre_tactic"] if cat else "Unknown",
        "category_id": cat["category_id"] if cat else 1
    })


@app.route("/api/questions/<int:category_id>", methods=["GET"])
def get_questions(category_id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT question_id, question, difficulty
        FROM questions
        WHERE category_id = %s
        ORDER BY RAND()
        LIMIT 3
    """, (category_id,))
    questions = cursor.fetchall()
    conn.close()
    return jsonify(questions)


@app.route("/api/evaluate", methods=["POST"])
def evaluate_answer():
    data = request.json
    question = data.get("question")
    user_answer = data.get("answer")
    question_id = data.get("question_id")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT reference_answer FROM questions WHERE question_id = %s", (question_id,))
    row = cursor.fetchone()
    conn.close()

    reference = row["reference_answer"] if row else ""

    prompt = f"""You are a cybersecurity instructor evaluating a student's answer.

Question: {question}
Reference Answer: {reference}
Student Answer: {user_answer}

Evaluate and respond in this exact format:
SCORE: [0-10]
STRENGTHS: [what they got right]
WEAKNESSES: [what they missed]
VERDICT: [Pass/Fail]"""

    response = llm.invoke(prompt).content

    lines = response.strip().split("\n")
    result = {"score": 0, "strengths": "", "weaknesses": "", "verdict": "Fail", "raw": response}

    for line in lines:
        if line.startswith("SCORE:"):
            try:
                result["score"] = int(line.replace("SCORE:", "").strip().split("/")[0])
            except:
                result["score"] = 0
        elif line.startswith("STRENGTHS:"):
            result["strengths"] = line.replace("STRENGTHS:", "").strip()
        elif line.startswith("WEAKNESSES:"):
            result["weaknesses"] = line.replace("WEAKNESSES:", "").strip()
        elif line.startswith("VERDICT:"):
            result["verdict"] = line.replace("VERDICT:", "").strip()

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
