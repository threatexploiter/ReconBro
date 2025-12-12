# ReconBro — AI-Powered Bug Bounty Recon Automation

ReconBro is an AI-driven **bug bounty reconnaissance automation system** built using:

- **Next.js** (frontend + backend routes)
- **OpenAI** (AI agent to interpret user instructions)
- **Recon.sh** (high-performance recon pipeline)
- **Multi-platform asset scrapers** (HackerOne, Bugcrowd, Intigriti, YesWeHack)
- **Beautiful ChatGPT-style UI**

Users simply type:

```Start recon on https://hackerone.com/roke_vdp```

And ReconBro automatically:

1. Detects the bug bounty platform  
2. Downloads scope assets (CSV/Burp)  
3. Creates the recon folder  
4. Executes the Recon.sh pipeline  
5. Logs progress  
6. Responds in chat in real-time  

---

# 📌 Features

### 🔥 1. AI Assistant (OpenAI-powered)
- Converts natural language → structured JSON → automated actions  
- No buttons or forms needed  
- Handles:
  - Starting recon  
  - Fetching assets  
  - Clarifying missing info  
  - Detecting platform from URL  

---

### 🌐 2. Multi-Platform Support
| Platform | Automatic Scope Download | AI HTML Extraction | Status |
|---------|----------------------------|--------------------|--------|
| **HackerOne** | ✔ CSV + Burp config | Optional | **Fully supported** |
| **Bugcrowd** | ❌ No downloads | ✔ AI extraction | Planned |
| **Intigriti** | ❌ No downloads | ✔ AI extraction | Planned |
| **YesWeHack** | ❌ No downloads | ✔ AI extraction | Planned |

---

### 🔧 3. Automated Recon Engine
Your provided **Recon.sh** is integrated directly.

Pipeline includes:

- Subdomain enumeration  
- Port scanning  
- HTTPX discovery  
- Parameter spidering  
- CORS/special payload scans  
- Nuclei with custom templates  
- Discord webhook notifications  
- Massive directory and output management  

All triggered automatically from chat.

---

### 💾 4. Program Folder Structure

When user starts recon on a program:
```
hackerone-results/
└── roke_vdp/
├── burp.json
├── scope.csv
├── roots.txt
├── scope.txt
├── urls.txt
└── Recon.sh (copied or executed from main)
```

---

### 📟 5. Script Execution with Logging

ReconBro spawns Recon.sh safely:

bash Recon.sh program_directory


Outputs go to:


```
recon-logs/
recon-YYYY-MM-DD-HH-MM.out.log
recon-YYYY-MM-DD-HH-MM.err.log
```

---

# 📁 Project Structure


```
my-app/
│
├── app/
│ ├── page.js # Chat UI
│ ├── layout.js # Global layout
│ ├── api/
│ │ ├── assistant/
│ │ │ └── route.js # AI engine + recon execution
│ │ ├── ping/route.js # Health check
│ │ └── hackerone/route.js # Standalone asset fetcher
│ │
│ ├── components/
│ │ ├── Header.js
│ │ └── Footer.js
│ │
│ ├── docs/page.js
│ ├── privacy/page.js
│ └── terms/page.js
│
├── lib/
│ ├── hackerone.js # CSV/Burp downloader
│ ├── platforms.js # Multi-platform universal scrapers
│ ├── ai-scraper.js # HTML → AI → Scope parser
│
├── hackerone-results/ # Programs + assets + recon data
│ ├── Recon.sh # Recon pipeline
│ └── <program>/
│
├── recon-logs/ # Log output for all recon tasks
│
└── README.md
```

---

# ⚙️ How It Works (Technical)

### 1️⃣ User sends message  
Example:


Start recon on https://hackerone.com/roke_vdp


### 2️⃣ Assistant route sends system prompt → OpenAI  
The system prompt forces the model to return ONLY JSON:

```json
{
  "action": "start_recon",
  "platform": "hackerone",
  "programUrl": "https://hackerone.com/roke_vdp",
  "programName": "roke_vdp",
  "confirm": "Starting recon for roke_vdp..."
}

3️⃣ Backend executes action

If:

action = start_recon
platform = hackerone


Steps executed:

fetchHackeroneAssets(programUrl)

Create folder:

hackerone-results/<program>/


Copy or call Recon.sh:

bash Recon.sh hackerone-results/<program>


Return JSON response to frontend.
```
## 🔌 Setup Instructions
1. Install dependencies
npm install

2. Add environment variable

Create .env.local:
```
OPENAI_API_KEY=YOUR_KEY_HERE
```
3. Make Recon.sh executable
chmod +x hackerone-results/Recon.sh
4. Modify Recon.sh as per ur needs add your discord webhook 
```
WEBHOOK_URL="YOUR-WEBHOOK" 
TOOLS_DIR=YOUR-TOOLS-DIR
```

5. Start the server
npm run dev


### Test asset download:
POST /api/hackerone
{
  "programUrl": "https://hackerone.com/roke_vdp"
}

Test through chat:

Enter in UI:
```
start recon on https://hackerone.com/roke_vdp
```
### 🔐 Security Notes

### ⚠ Do NOT expose ReconBro to the public internet without authentication.
Recon.sh executes local commands
Program folders are writable
Avoid running as root
Validate all inputs before allowing execution

### Roadmap
- Real-time recon log streaming to UI
- Full platform support (Bugcrowd, Intigriti, YesWeHack)
- Dashboard of completed recon jobs
- PDF summary reports
- Multi-user authentication
- Docker version

### Open to Contributing!!!

Contributions are welcome!
You can help improve:
- Recon engine
- AI parsing
- Platform scrapers
- UI/UX
- Templates
- Documentation
Just open a pull request.

Author - @threatexploiter