# AI Cyber Threat Analyst Bot

A cybersecurity training tool that simulates real attack scenarios and evaluates how well you respond. Pick an attack type, choose a target system, set the severity — the system generates a realistic incident log and then interviews you like a senior SOC analyst would.

Built as a cybersecurity parallel to the NLP AI Technical Interviewer project. Same architecture, different domain.

---

## What it does

You select three things: what kind of attack happened, what system was targeted, and how severe it is. The backend pulls a matching incident log from the database (or generates one using the LLM if no match exists), detects the MITRE ATT&CK technique, and fires 3 questions at you. When you answer, the AI scores your response from 0–10 and tells you what you got right and what you missed.

---

## Project layout

```
cybersec-project/
├── backend/
│   ├── app.py            
│   ├── database.sql      
│   └── requirements.txt
└── frontend/
    └── src/
        └── App.jsx       
```

---

## Getting it running

**Database first**

Open MySQL and run the SQL file:
```bash
mysql -u root -p < backend/database.sql
```

**Backend**

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file with your Groq API key:
```
GROQ_API_KEY=your_key_here
```

Then start the server:
```bash
python app.py
```

It runs on `http://localhost:5000`.

**Frontend**

```bash
cd frontend
npm install
npm start
```

Opens on `http://localhost:3000`.

---

## API routes

| Method | Route | What it does |
|--------|-------|--------------|
| GET | /api/attacks | Returns all attack types for the dropdown |
| POST | /api/generate-incident | Builds an incident log from your selections |
| GET | /api/questions/:id | Fetches 3 random questions for the attack category |
| POST | /api/evaluate | Scores your answer against the reference answer |

---

## What's in the database

8 attack categories, each mapped to a real MITRE ATT&CK technique. 5 questions per category with reference answers. 10 pre-written incident logs with realistic timestamps, IPs, and indicators. No external dataset needed — everything is self-contained in `database.sql`.

The 8 attacks covered: Ransomware (T1486), Phishing (T1566), SQL Injection (T1190), Brute Force (T1110), DDoS (T1498), Privilege Escalation (T1068), Man in the Middle (T1557), Zero Day Exploit (T1203).

---

## Tech stack

Python, Flask, LangChain, Groq API (Llama 3.3), MySQL, React.
