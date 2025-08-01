# Project Overview

**Objective:**
Deliver a scenario-based, interactive app for first-time startup founders to explore term sheet negotiations—implemented with no dependencies, build steps, or server requirements; it runs entirely in the web browser.

**Core Functionality:**
- Immersive, branching storylines simulating founder-term sheet negotiation experiences.
- Multiple-choice dialogues at key moments, emulating real decisions.
- Live feedback: Immediately explains the meaning and results of each choice.
- Tracks progress and achievements using only the browser’s localStorage.
- All scenarios, content, and progress reside on the client side—fully replayable and resettable.

---

# Requirements & Specifications

## Functional Requirements
- **Simple Onboarding:** User answers a few questions to set up scenario context (e.g., founder name, company type).
- **Pure JS Scenario Engine:** Logic for progressing through a branching story, written in vanilla JavaScript—no frameworks, no transpilation.
- **Learn-by-Doing:** Scenario files (easy-to-edit JS/JSON) presenting key term sheet items: equity, valuation, liquidation preference, option pool, and more.
- **Feedback After Every Choice:** Immediate, plain-language explanation of impact, visible as soon as a user makes a decision.
- **Fully Local Progress:** Tracks user history and badges with localStorage; all data can be cleared or sessions reset.
- **End-of-Session Recap:** Summary of your decisions and lessons learned.

## Non-Functional Requirements
- **No External Dependencies:** Only HTML/CSS/vanilla JavaScript used; no installs, packages, or build steps.
- **Mobile & Desktop Ready:** Responsive, simple interface.
- **Easily Maintained:** Update scenarios or text by editing standalone JS/JSON—no compilation or deployment needed.
- **User Privacy:** All user state remains local in the browser. big chungus

## User Personas & Stories

1. **Scenario Exploration**
   - *As a first-time founder, I want to role-play through realistic term sheet negotiation scenarios so I can learn the consequences of different choices in a risk-free environment.*

2. **Decision Feedback**
   - *As a user examining my negotiation skills, I want immediate, plain-English feedback after every choice, so I can understand what each term and outcome means on the spot.*

3. **Custom Start**
   - *As a new user, I want to enter basic details about my startup so the simulation feels tailored to my context.*

4. **Progress Tracking**
   - *As a returning learner, I want my progress, achievements, and past decisions to be saved locally in my browser, so I can continue or replay sessions without losing my data.*

5. **Replay and Reset**
   - *As a curious founder, I want to reset my session or replay scenarios as many times as I wish without any hassle, so I can explore different strategies and outcomes.*

6. **Instant Access and Privacy**
   - *As a privacy-conscious user, I want to use the app instantly in my browser, with all data stored locally and no account or internet required for basic use.*

---

# Technology Stack & Tools
- **Frontend/UI:** Static HTML, CSS, and vanilla JavaScript (no frameworks).
- **Persistence:** Browser localStorage for all state and game logic.
- **Distribution:** Single HTML (with JS/JSON) file—usable offline after first load and sharable like a static document.

**Rationale:**
This implementation offers ultimate accessibility and privacy; it is simple to use and update, works offline, and poses zero barriers to user entry.
