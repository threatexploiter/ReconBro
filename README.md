# ReconBro — Bug Bounty Recon Automation

ReconBro is a **local-first bug bounty reconnaissance automation system** designed to streamline scope collection and recon execution across multiple bug bounty platforms.

It combines a **Next.js-based interface**, a **lightweight AI intent parser**, **platform-specific scope scrapers**, and a **user-controlled recon pipeline**.

ReconBro is intended for **local use only** and prioritizes **control, transparency, and safety**.

---

## Overview

ReconBro allows users to interact via a chat-style interface to:

- Provide one or more program URLs
- Automatically extract in-scope assets
- Organize targets into structured files
- Trigger reconnaissance manually when ready

Scraping and recon execution are intentionally separated to avoid unsafe automation.

---

## Key Capabilities

- AI-assisted intent parsing (no execution logic in AI)
- Multi-platform scope scraping
- Clean target categorization
- Manual recon execution control
- Background job tracking
- Compatible with custom recon pipelines
---

## Supported Platforms

| Platform     | Scope Method                  | Status |
|-------------|-------------------------------|--------|
| HackerOne   | CSV and Burp asset download   | Stable |
| Bugcrowd    | HTML scope scraping           | Stable |
| Intigriti   | Assets table scraping         | Stable |
| YesWeHack   | Scope section scraping        | Stable |

---

## Scope Output Structure

Each program is stored in an isolated directory under `output/`:

### Installation 
#### Windows
- clone the repository 
- install all the required dependencies
- get your OPENAI API KEY
- make a new .env.local file and put your OPENAI api key in there
- start the server
```
npm install
npx playwright install
npm run dev
```
- In the ui enter do recon on program_url
### note in windows it can only scrape it cannot run recon.sh
#### Linux - (made for linux)
- clone the repository 
```
https://github.com/threatexploiter/ReconBro.git
cd ReconBro
```
- install all the required dependencies
- get your OPENAI API KEY
- make a new .env.local file and put your OPENAI api key in there
- start the server
```
npm install
npx playwright install
npm run dev
```
- In the ui enter do recon on program_url
- All of the output of scopes will be in the output/ or hackerone-results directory 


### Example usage
```
start recon on https://app.intigriti.com/programs/dropbox/dropbox/detail
```

## Environment configuration
### Create .env.local:
```
OPENAI_API_KEY=your_api_key_here
```
### Recon script permissions
```
chmod +x output/Recon.sh
```
### Start the application
```
npm run dev
```

## Change Recon.sh file
- Add your discord webhook
- Add your own tools directory 
