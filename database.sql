-- ============================================
-- AI Cyber Threat Analyst Bot - Database Setup
-- ============================================

CREATE DATABASE IF NOT EXISTS cybersec_db;
USE cybersec_db;

-- Attack categories (maps to MITRE ATT&CK tactics)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    attack_name VARCHAR(100) NOT NULL,
    mitre_id VARCHAR(20),
    mitre_tactic VARCHAR(100),
    description TEXT
);

-- Question bank per attack category
CREATE TABLE questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    question TEXT NOT NULL,
    reference_answer TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Incident scenarios (the "logs" shown to user)
CREATE TABLE scenarios (
    scenario_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    severity ENUM('low', 'medium', 'high', 'critical'),
    target_system VARCHAR(100),
    log_text TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO categories (attack_name, mitre_id, mitre_tactic, description) VALUES
('Ransomware',      'T1486', 'Impact',              'Encrypts victim files and demands ransom'),
('Phishing',        'T1566', 'Initial Access',       'Deceptive emails to steal credentials or deploy malware'),
('SQL Injection',   'T1190', 'Initial Access',       'Injecting malicious SQL into web application inputs'),
('Brute Force',     'T1110', 'Credential Access',    'Repeated login attempts to guess credentials'),
('DDoS',            'T1498', 'Impact',               'Flooding a target with traffic to deny service'),
('Privilege Escalation', 'T1068', 'Privilege Escalation', 'Gaining higher-level permissions on a system'),
('Man in the Middle', 'T1557', 'Credential Access',  'Intercepting communications between two parties'),
('Zero Day Exploit','T1203', 'Execution',            'Exploiting unknown/unpatched software vulnerability');

-- RANSOMWARE QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(1, 'What is the FIRST action you should take when ransomware is detected on a system?',
 'Immediately isolate the infected system from the network by disconnecting it from LAN/WiFi to prevent lateral spread. Do NOT shut it down as volatile memory may contain decryption keys.',
 'medium'),
(1, 'How would you identify which files have been encrypted by ransomware?',
 'Check for changed file extensions (e.g., .locked, .encrypted), look for ransom note files (README.txt), use tools like Ransomware File Decryptor, and check Windows Event Logs for mass file modification events.',
 'medium'),
(1, 'Should an organization pay the ransom? Justify your answer.',
 'Generally NO. Paying does not guarantee file recovery, funds criminal operations, and marks the org as a paying target. Restore from clean backups instead. FBI and CISA advise against payment.',
 'hard'),
(1, 'What backup strategy would have prevented data loss in a ransomware attack?',
 'The 3-2-1 backup rule: 3 copies of data, on 2 different media types, with 1 copy offsite/offline (air-gapped). Offline backups cannot be encrypted by ransomware.',
 'medium'),
(1, 'How does ransomware typically enter an organization?',
 'Most common vectors: phishing emails with malicious attachments, RDP exploitation, drive-by downloads, and supply chain attacks. Phishing accounts for ~90% of ransomware infections.',
 'easy');

-- PHISHING QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(2, 'What are the key indicators of a phishing email?',
 'Suspicious sender domain, urgency/pressure language, mismatched URLs (hover to check), poor grammar, unexpected attachments, requests for credentials, and spoofed display names.',
 'easy'),
(2, 'A user clicked a phishing link and entered their credentials. What steps do you take?',
 'Immediately reset the compromised account password, revoke all active sessions/tokens, enable MFA if not already active, check audit logs for unauthorized access, and notify the security team for investigation.',
 'medium'),
(2, 'What is spear phishing and how does it differ from regular phishing?',
 'Spear phishing is targeted phishing where attackers research the victim to craft personalized, convincing messages. Regular phishing is mass/generic. Spear phishing has a much higher success rate.',
 'medium'),
(2, 'What technical controls can prevent phishing attacks?',
 'Email filtering (SPF, DKIM, DMARC), anti-phishing tools, URL scanning, MFA on all accounts, security awareness training, and DNS filtering to block known malicious domains.',
 'hard'),
(2, 'Explain how DMARC protects against phishing.',
 'DMARC (Domain-based Message Authentication) tells receiving mail servers what to do when SPF/DKIM checks fail. Set to reject/quarantine, it prevents attackers from spoofing your domain in emails.',
 'hard');

-- SQL INJECTION QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(3, 'What is SQL injection and give a basic example?',
 'SQL injection is inserting malicious SQL into input fields. Example: entering '' OR 1=1-- in a login field can bypass authentication by making the query always return true.',
 'easy'),
(3, 'How do you prevent SQL injection in a web application?',
 'Use parameterized queries/prepared statements, input validation and sanitization, least-privilege database accounts, WAF (Web Application Firewall), and stored procedures.',
 'medium'),
(3, 'What is the difference between in-band and blind SQL injection?',
 'In-band SQLi returns results directly in the HTTP response. Blind SQLi gives no direct output — attacker infers data through boolean responses (true/false) or time delays.',
 'hard'),
(3, 'An attacker used SQL injection to dump the users table. What is your incident response?',
 'Immediately patch the vulnerability, rotate all database credentials, notify affected users, check logs for scope of breach, assess if PII was exposed (may trigger GDPR notification), and conduct a full security audit.',
 'hard'),
(3, 'What tools does an attacker use for SQL injection?',
 'sqlmap (automated SQLi scanner), Burp Suite (intercept and modify requests), manual testing with browser dev tools. Defenders can detect these with WAF and IDS signatures.',
 'medium');

-- BRUTE FORCE QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(4, 'What is the difference between brute force and dictionary attacks?',
 'Brute force tries every possible character combination. Dictionary attacks use a wordlist of common passwords. Dictionary attacks are faster; brute force is exhaustive but slow.',
 'easy'),
(4, 'How would you detect a brute force attack on SSH?',
 'Monitor /var/log/auth.log for repeated failed login attempts from same IP, use tools like fail2ban, set up alerts for >5 failed logins in 60 seconds, check with: grep "Failed password" /var/log/auth.log | sort | uniq -c',
 'medium'),
(4, 'What controls prevent brute force attacks?',
 'Account lockout policies, rate limiting, CAPTCHA, MFA, IP allowlisting for admin services, using SSH keys instead of passwords, fail2ban, and moving SSH to non-standard port.',
 'medium'),
(4, 'An attacker successfully brute forced an admin account. What now?',
 'Lock the account immediately, revoke all active sessions, reset credentials, check audit logs for actions taken during compromise, assess damage, patch the entry point, and enforce MFA.',
 'hard'),
(4, 'What is credential stuffing and how is it different from brute force?',
 'Credential stuffing uses leaked username/password pairs from data breaches to try login on other services. It exploits password reuse. Brute force generates guesses; stuffing uses real stolen credentials.',
 'medium');

-- DDOS QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(5, 'What is the difference between a DoS and DDoS attack?',
 'DoS (Denial of Service) comes from a single source. DDoS (Distributed DoS) comes from many compromised machines (botnet) simultaneously, making it much harder to block by IP.',
 'easy'),
(5, 'What are the three categories of DDoS attacks?',
 'Volumetric (flood bandwidth - UDP flood, ICMP flood), Protocol attacks (exploit network protocols - SYN flood, Ping of Death), Application layer attacks (target web apps - HTTP flood, Slowloris).',
 'medium'),
(5, 'How would you mitigate an ongoing DDoS attack?',
 'Contact ISP for upstream filtering, enable CDN/DDoS protection (Cloudflare), implement rate limiting, use anycast diffusion, blackhole routing for attacking IPs, and scale up infrastructure if possible.',
 'hard'),
(5, 'What is a SYN flood attack?',
 'Attacker sends many TCP SYN packets without completing the 3-way handshake. Server allocates resources for each half-open connection until it runs out of memory. Mitigated by SYN cookies.',
 'medium'),
(5, 'What logs would you check during a DDoS investigation?',
 'Firewall logs (connection counts per IP), web server access logs (request rates), netflow data, IDS/IPS alerts, and cloud provider traffic analytics dashboards.',
 'medium');

-- PRIVILEGE ESCALATION QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(6, 'What is privilege escalation and name its two types?',
 'Gaining higher permissions than authorized. Vertical escalation: low-privilege user gains admin/root. Horizontal escalation: user accesses another user''s resources at same privilege level.',
 'easy'),
(6, 'How would you detect privilege escalation on a Windows system?',
 'Monitor Event ID 4672 (special privileges assigned), 4673 (privileged service called), 4674 (privileged object operation), check for new accounts in admin groups, monitor scheduled tasks and services.',
 'hard'),
(6, 'What is a common Linux privilege escalation technique?',
 'SUID binary exploitation, sudo misconfigurations (sudo -l), cron job hijacking, writable /etc/passwd, kernel exploits, and PATH variable manipulation.',
 'hard'),
(6, 'How does least privilege principle prevent escalation attacks?',
 'By giving users/processes only the minimum permissions needed for their role, attackers who compromise a low-privilege account cannot access sensitive resources or escalate without an additional exploit.',
 'medium'),
(6, 'An attacker gained root on a Linux server. What is your response?',
 'Isolate the system, preserve forensic evidence, identify entry point via logs, check for persistence mechanisms (crontabs, new users, SSH keys), rebuild from clean image, and patch the vulnerability.',
 'hard');

-- MITM QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(7, 'How does a Man-in-the-Middle attack work?',
 'Attacker positions themselves between two communicating parties, intercepting and potentially modifying traffic. Both parties believe they are communicating directly with each other.',
 'easy'),
(7, 'What is ARP poisoning and how does it enable MITM?',
 'ARP poisoning sends fake ARP replies linking the attacker''s MAC to a legitimate IP. Victims send traffic to attacker''s machine instead of intended destination, enabling interception.',
 'medium'),
(7, 'How does HTTPS protect against MITM attacks?',
 'HTTPS uses TLS to encrypt traffic and authenticate the server via certificates signed by trusted CAs. Attackers cannot decrypt traffic or forge certificates without detection (certificate errors appear).',
 'medium'),
(7, 'What is SSL stripping?',
 'Attacker downgrades HTTPS connection to HTTP by intercepting the initial request before HTTPS is established. Mitigated by HSTS (HTTP Strict Transport Security) which forces HTTPS.',
 'hard'),
(7, 'How would you detect a MITM attack on a network?',
 'Monitor ARP tables for duplicate MACs, use ARP inspection on switches, check SSL certificate validity, use network monitoring tools (Wireshark, Zeek), and deploy IDS with MITM signatures.',
 'hard');

-- ZERO DAY QUESTIONS
INSERT INTO questions (category_id, question, reference_answer, difficulty) VALUES
(8, 'What is a zero-day vulnerability?',
 'A software vulnerability unknown to the vendor with no available patch. Called zero-day because defenders have had zero days to prepare. Extremely valuable to attackers.',
 'easy'),
(8, 'How do you defend against zero-day exploits when no patch exists?',
 'Network segmentation, application whitelisting, behavior-based EDR (not just signature-based AV), sandboxing, least privilege, and threat hunting for anomalous behavior.',
 'hard'),
(8, 'What is virtual patching?',
 'Applying a WAF or IPS rule to block exploitation of a known vulnerability before the official vendor patch is available. Provides temporary protection without modifying the vulnerable application.',
 'medium'),
(8, 'What is responsible disclosure in the context of zero-days?',
 'Security researcher privately notifies the vendor of the vulnerability, gives them time (typically 90 days) to patch before public disclosure. Balances public safety with giving vendors time to fix.',
 'medium'),
(8, 'How does an EDR differ from traditional antivirus in detecting zero-days?',
 'Traditional AV uses signatures (known malware hashes). EDR uses behavioral analysis, memory inspection, and ML to detect suspicious behavior patterns even from unknown/zero-day malware.',
 'hard');

-- SCENARIOS
INSERT INTO scenarios (category_id, severity, target_system, log_text) VALUES
(1, 'critical', 'Windows Workstation',
 '[2026-03-15 02:14:33] Mass file rename detected on WIN-PC01: 847 files renamed with .locked extension\n[2026-03-15 02:14:35] README_DECRYPT.txt created in C:\\Users\\john\\Desktop\\\n[2026-03-15 02:14:38] Outbound connection to 185.220.101.47:443 (known C2 server)\n[2026-03-15 02:14:41] Shadow copies deletion attempt: vssadmin delete shadows /all\n[2026-03-15 02:14:44] ALERT: Ransomware signature matched - LockBit 3.0'),

(1, 'high', 'Database Server',
 '[2026-03-15 08:22:11] Unusual file I/O spike on DB-SERVER-01: 2,340 write ops/sec\n[2026-03-15 08:22:14] New process spawned: cmd.exe -> powershell.exe -> encrypt.exe\n[2026-03-15 08:22:19] Files in /var/lib/mysql renamed to *.encrypted\n[2026-03-15 08:22:23] DNS query to ransom-payment.onion.to'),

(2, 'medium', 'Windows Workstation',
 '[2026-03-15 10:05:12] User john.doe@company.com opened attachment: Invoice_March2026.pdf.exe\n[2026-03-15 10:05:14] Macro execution detected in Office document\n[2026-03-15 10:05:18] Outbound HTTP POST to 192.168.evil.com/collect with form data\n[2026-03-15 10:05:21] Credential harvester process detected: mimikatz.exe'),

(2, 'high', 'Active Directory',
 '[2026-03-15 14:30:05] Email from ceo@comp4ny.com (spoofed) to hr@company.com requesting urgent wire transfer\n[2026-03-15 14:31:22] HR user clicked link: http://company-portal.fake.net/login\n[2026-03-15 14:31:25] Credentials submitted to external domain\n[2026-03-15 14:31:30] Active Directory login from new IP: 203.0.113.45 (Ukraine)'),

(3, 'high', 'Web Server',
 '[2026-03-15 16:44:01] GET /search?q='' OR 1=1-- HTTP/1.1 from 10.0.2.15\n[2026-03-15 16:44:02] SQL Error: You have an error in your SQL syntax (exposed in response)\n[2026-03-15 16:44:08] GET /search?q='' UNION SELECT username,password FROM users-- \n[2026-03-15 16:44:09] Response contained 1,247 rows - users table dumped\n[2026-03-15 16:44:15] Attacker IP 10.0.2.15 downloaded full database via sqlmap'),

(3, 'critical', 'Database Server',
 '[2026-03-15 22:10:44] WAF BYPASS detected - encoded SQLi payload in User-Agent header\n[2026-03-15 22:10:45] Stacked query executed: DROP TABLE audit_logs;\n[2026-03-15 22:10:47] xp_cmdshell enabled on MSSQL server\n[2026-03-15 22:10:51] OS command executed via SQL: whoami -> NT AUTHORITY\\SYSTEM'),

(4, 'medium', 'Linux Server',
 '[2026-03-15 03:12:01] Failed SSH login for root from 45.33.32.156 (attempt 1/500)\n[2026-03-15 03:12:02] Failed SSH login for root from 45.33.32.156 (attempt 2/500)\n[2026-03-15 03:12:45] Failed SSH login for admin from 45.33.32.156 (attempt 247/500)\n[2026-03-15 03:14:22] SUCCESSFUL SSH login for sysadmin from 45.33.32.156\n[2026-03-15 03:14:25] sudo su - executed - root shell obtained'),

(5, 'critical', 'Web Server',
 '[2026-03-15 11:00:00] Inbound traffic spike: 847 Gbps (normal: 2 Gbps)\n[2026-03-15 11:00:01] 14.2M packets/sec from 50,000+ unique IPs (botnet)\n[2026-03-15 11:00:03] SYN flood detected: 9.8M half-open connections\n[2026-03-15 11:00:05] Web server response time: 45,000ms (normal: 120ms)\n[2026-03-15 11:00:07] SERVICE DOWN: nginx worker processes exhausted'),

(6, 'high', 'Windows Workstation',
 '[2026-03-15 19:22:11] User intern01 ran: whoami /priv\n[2026-03-15 19:22:14] SeImpersonatePrivilege found - attempting JuicyPotato exploit\n[2026-03-15 19:22:18] New service created with SYSTEM permissions\n[2026-03-15 19:22:21] Event ID 4672: Special privileges assigned to intern01\n[2026-03-15 19:22:24] intern01 added to Administrators group'),

(7, 'high', 'Network',
 '[2026-03-15 13:45:01] ARP reply: 192.168.1.1 is at aa:bb:cc:dd:ee:ff (gateway MAC changed)\n[2026-03-15 13:45:02] Duplicate ARP entry detected for 192.168.1.1\n[2026-03-15 13:45:10] SSL certificate warning on banking-site.com (cert mismatch)\n[2026-03-15 13:45:15] Credentials intercepted in plaintext - HTTP downgrade attack\n[2026-03-15 13:45:18] 847 packets captured by unknown host 192.168.1.99');
