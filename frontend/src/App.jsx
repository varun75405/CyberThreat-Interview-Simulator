import { useState, useEffect, useRef } from "react";

const API = "http://localhost:5000/api";

const ATTACK_TYPES = [
  { category_id: 1, attack_name: "Ransomware",           mitre_id: "T1486", mitre_tactic: "Impact" },
  { category_id: 2, attack_name: "Phishing",             mitre_id: "T1566", mitre_tactic: "Initial Access" },
  { category_id: 3, attack_name: "SQL Injection",        mitre_id: "T1190", mitre_tactic: "Initial Access" },
  { category_id: 4, attack_name: "Brute Force",          mitre_id: "T1110", mitre_tactic: "Credential Access" },
  { category_id: 5, attack_name: "DDoS",                 mitre_id: "T1498", mitre_tactic: "Impact" },
  { category_id: 6, attack_name: "Privilege Escalation", mitre_id: "T1068", mitre_tactic: "Privilege Escalation" },
  { category_id: 7, attack_name: "Man in the Middle",    mitre_id: "T1557", mitre_tactic: "Credential Access" },
  { category_id: 8, attack_name: "Zero Day Exploit",     mitre_id: "T1203", mitre_tactic: "Execution" },
];

const TARGETS = ["Web Server", "Database Server", "Windows Workstation", "Linux Server", "Active Directory", "Cloud Storage", "IoT Device", "Network"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

const SEVERITY_COLOR = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444"
};

export default function App() {
  const [attacks, setAttacks] = useState(ATTACK_TYPES);
  const [selectedAttack, setSelectedAttack] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [incident, setIncident] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [scores, setScores] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/attacks`)
      .then(r => r.json())
      .then(data => { if (data && data.length > 0) setAttacks(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const generateIncident = async () => {
    if (!selectedAttack || !selectedTarget || !selectedSeverity) return;
    setLoading(true);
    setPhase("incident");

    try {
      const res = await fetch(`${API}/generate-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attack_type: selectedAttack,
          target_system: selectedTarget,
          severity: selectedSeverity
        })
      });
      const data = await res.json();
      setIncident(data);

      const qRes = await fetch(`${API}/questions/${data.category_id}`);
      const qData = await qRes.json();
      setQuestions(qData);

      setMessages([
        {
          role: "bot",
          content: `Incident detected! I've analyzed the logs and identified a **${data.attack_name}** attack (MITRE ${data.mitre_id} — ${data.mitre_tactic}).\n\nLet's begin the threat analysis interview. I'll ask you 3 questions to assess your response.`
        },
        {
          role: "bot",
          content: qData[0]?.question || "No questions found.",
          questionIndex: 0
        }
      ]);

      setPhase("interview");
    } catch {
      setMessages([{ role: "bot", content: "Could not connect to backend. Make sure Flask is running on port 5000." }]);
      setPhase("interview");
    }

    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    const q = questions[currentQ];

    setMessages(prev => [...prev, { role: "user", content: answer }]);
    setAnswer("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          answer,
          question_id: q.question_id
        })
      });
      const result = await res.json();
      setScores(prev => [...prev, result.score]);

      setMessages(prev => [...prev, { role: "bot", evaluation: result }]);

      const next = currentQ + 1;
      if (next < questions.length) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "bot",
            content: questions[next].question,
            questionIndex: next
          }]);
          setCurrentQ(next);
          setLoading(false);
        }, 600);
      } else {
        setTimeout(() => {
          const allScores = [...scores, result.score];
          const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
          setMessages(prev => [...prev, {
            role: "bot",
            finalScore: avg,
            totalQuestions: questions.length
          }]);
          setPhase("done");
          setLoading(false);
        }, 600);
      }
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "Evaluation failed. Check backend connection." }]);
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setIncident(null);
    setMessages([]);
    setQuestions([]);
    setCurrentQ(0);
    setScores([]);
    setAnswer("");
    setSelectedAttack("");
    setSelectedTarget("");
    setSelectedSeverity("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

      <div style={{ borderBottom: "1px solid #1e293b", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🛡
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", letterSpacing: "0.05em" }}>AI CYBER THREAT ANALYST</div>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em" }}>SECURITY OPERATIONS CENTER · TRAINING MODULE</div>
        </div>
        {phase !== "setup" && (
          <button onClick={reset} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            ↩ New Incident
          </button>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>

        {phase === "setup" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: "2rem", lineHeight: 1.7 }}>
              Select an attack scenario to simulate. The system will generate a realistic incident log and conduct a threat analysis interview to evaluate your response.
            </p>

            <div style={{ background: "#0f1724", border: "1px solid #1e293b", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: "0.15em", marginBottom: "1rem" }}>▸ STEP 1 — BUILD YOUR INCIDENT</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>

                <div>
                  <label style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>ATTACK TYPE</label>
                  <select
                    value={selectedAttack}
                    onChange={e => setSelectedAttack(e.target.value)}
                    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: selectedAttack ? "#f1f5f9" : "#64748b", padding: "10px 12px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">Select attack...</option>
                    {attacks.map(a => (
                      <option key={a.category_id} value={a.attack_name}>{a.attack_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>TARGET SYSTEM</label>
                  <select
                    value={selectedTarget}
                    onChange={e => setSelectedTarget(e.target.value)}
                    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: selectedTarget ? "#f1f5f9" : "#64748b", padding: "10px 12px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">Select target...</option>
                    {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>SEVERITY</label>
                  <select
                    value={selectedSeverity}
                    onChange={e => setSelectedSeverity(e.target.value)}
                    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: selectedSeverity ? (SEVERITY_COLOR[selectedSeverity] || "#f1f5f9") : "#64748b", padding: "10px 12px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="">Select severity...</option>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {(selectedAttack || selectedTarget || selectedSeverity) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  {selectedAttack && <span style={{ background: "#1e293b", border: "1px solid #3b82f6", color: "#60a5fa", padding: "4px 10px", borderRadius: 20, fontSize: 11 }}>⚡ {selectedAttack}</span>}
                  {selectedTarget && <span style={{ background: "#1e293b", border: "1px solid #8b5cf6", color: "#a78bfa", padding: "4px 10px", borderRadius: 20, fontSize: 11 }}>🖥 {selectedTarget}</span>}
                  {selectedSeverity && <span style={{ background: "#1e293b", border: `1px solid ${SEVERITY_COLOR[selectedSeverity]}`, color: SEVERITY_COLOR[selectedSeverity], padding: "4px 10px", borderRadius: 20, fontSize: 11 }}>● {selectedSeverity}</span>}
                </div>
              )}

              <button
                onClick={generateIncident}
                disabled={!selectedAttack || !selectedTarget || !selectedSeverity || loading}
                style={{
                  width: "100%", padding: "12px",
                  background: selectedAttack && selectedTarget && selectedSeverity ? "#ef4444" : "#1e293b",
                  color: selectedAttack && selectedTarget && selectedSeverity ? "#fff" : "#475569",
                  border: "none", borderRadius: 8, fontSize: 14, fontFamily: "inherit", fontWeight: 600,
                  cursor: selectedAttack && selectedTarget && selectedSeverity ? "pointer" : "not-allowed",
                  letterSpacing: "0.05em", transition: "background 0.2s"
                }}>
                {loading ? "⟳ Analyzing incident..." : "▶ GENERATE INCIDENT & START INTERVIEW"}
              </button>
            </div>
          </div>
        )}

        {incident && phase !== "setup" && (
          <div style={{ background: "#020817", border: "1px solid #1e293b", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "1.5rem", fontFamily: "monospace" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 11, color: "#ef4444", letterSpacing: "0.15em" }}>▸ INCIDENT LOG</span>
              <span style={{ background: "#1e293b", border: `1px solid ${SEVERITY_COLOR[selectedSeverity]}`, color: SEVERITY_COLOR[selectedSeverity], padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{selectedSeverity.toUpperCase()}</span>
              <span style={{ marginLeft: "auto", background: "#1e293b", border: "1px solid #3b82f6", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{incident.mitre_id} — {incident.mitre_tactic}</span>
            </div>
            {incident.log.split("\n").map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8, padding: "1px 0" }}>
                <span style={{ color: "#334155" }}>$ </span>{line}
              </div>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "1.5rem" }}>
            {messages.map((msg, i) => (
              <div key={i}>

                {msg.role === "bot" && msg.content && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                    <div style={{ background: "#0f1724", border: "1px solid #1e293b", borderRadius: "0 12px 12px 12px", padding: "12px 16px", maxWidth: "85%" }}>
                      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7 }}>
                        {msg.questionIndex !== undefined && (
                          <span style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 4 }}>Question {msg.questionIndex + 1} of {questions.length}</span>
                        )}
                        {msg.content.split("**").map((part, j) =>
                          j % 2 === 1 ? <strong key={j} style={{ color: "#f1f5f9" }}>{part}</strong> : part
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === "bot" && msg.evaluation && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                    <div style={{ background: "#0f1724", border: "1px solid #1e293b", borderRadius: "0 12px 12px 12px", padding: "12px 16px", maxWidth: "85%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: msg.evaluation.score >= 7 ? "#22c55e" : msg.evaluation.score >= 5 ? "#f59e0b" : "#ef4444" }}>
                          {msg.evaluation.score}/10
                        </span>
                        <span style={{ background: msg.evaluation.verdict === "Pass" ? "#14532d" : "#450a0a", color: msg.evaluation.verdict === "Pass" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {msg.evaluation.verdict}
                        </span>
                      </div>
                      {msg.evaluation.strengths && <div style={{ fontSize: 12, color: "#86efac", marginBottom: 4 }}>✓ {msg.evaluation.strengths}</div>}
                      {msg.evaluation.weaknesses && <div style={{ fontSize: 12, color: "#fca5a5" }}>✗ {msg.evaluation.weaknesses}</div>}
                    </div>
                  </div>
                )}

                {msg.role === "bot" && msg.finalScore !== undefined && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                    <div style={{ background: "#0f1724", border: "1px solid #334155", borderRadius: "0 12px 12px 12px", padding: "16px 20px", maxWidth: "85%" }}>
                      <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", marginBottom: 8 }}>▸ FINAL ASSESSMENT</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: msg.finalScore >= 7 ? "#22c55e" : msg.finalScore >= 5 ? "#f59e0b" : "#ef4444", marginBottom: 4 }}>
                        {msg.finalScore}/10
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>
                        {msg.finalScore >= 8 ? "Excellent threat analyst. You demonstrated strong incident response knowledge." :
                         msg.finalScore >= 6 ? "Good performance. Review the areas marked for improvement." :
                         "Needs improvement. Study the reference answers and try again."}
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === "user" && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "#1e3a5f", border: "1px solid #1d4ed8", borderRadius: "12px 0 12px 12px", padding: "10px 16px", maxWidth: "80%", fontSize: 13, color: "#bfdbfe", lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
                <div style={{ background: "#0f1724", border: "1px solid #1e293b", borderRadius: "0 12px 12px 12px", padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {phase === "interview" && !loading && (
          <div style={{ background: "#0f1724", border: "1px solid #334155", borderRadius: 10, display: "flex", overflow: "hidden" }}>
            <input
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitAnswer()}
              placeholder="Your answer..."
              style={{ flex: 1, background: "transparent", border: "none", padding: "14px 16px", color: "#f1f5f9", fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim()}
              style={{ background: answer.trim() ? "#ef4444" : "#1e293b", border: "none", padding: "14px 20px", color: "#fff", cursor: answer.trim() ? "pointer" : "not-allowed", fontSize: 16, transition: "background 0.2s" }}>
              ↑
            </button>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
          select option { background: #1e293b; color: #f1f5f9; }
        `}</style>
      </div>
    </div>
  );
}
