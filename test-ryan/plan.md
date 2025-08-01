problem_statement: "Mobile app that smartly schedules work/social tasks, optimizes daily life, and gives proactive AI tips."
scope:
  in:
    - Smart scheduling of overlapping work and social tasks
    - Two main sections: Work Life and Social Life/Trips
    - Daily optimization to improve work/social balance
    - Proactive AI agent giving tips based on social history
    - Mobile application interface
  out:
    - Desktop or web versions
    - Integration with external calendars (Google, Outlook, etc.)
    - Manual-only tip requests (AI tips are proactive)
user_journeys:
  - id: UJ1
    role: "Busy professional"
    motivation: "Wants to efficiently schedule work and social tasks"
    outcome: "Has a balanced, optimized daily plan"
  - id: UJ2
    role: "Socially active user"
    motivation: "Wants to maximize social time without hurting work productivity"
    outcome: "Gets tips and schedules that improve both work and social life"
functional_requirements:
  - id: FR1
    priority: "MUST"
    text: "Allow users to input, edit, and categorize tasks as work or social"
  - id: FR2
    priority: "MUST"
    text: "Automatically resolve overlapping tasks and optimize daily schedule"
  - id: FR3
    priority: "MUST"
    text: "Provide two main sections: Work Life and Social Life/Trips"
  - id: FR4
    priority: "MUST"
    text: "AI agent analyzes social history and proactively gives improvement tips"
  - id: FR5
    priority: "SHOULD"
    text: "Visualize daily/weekly schedule and optimization suggestions"
non_functional_constraints:
  performance: "P95 < 200 ms"
  availability: "99.9 %-monthly"
  security: "OAuth2; GDPR"
glossary:
  - term: "Smart scheduling"
    definition: "Automatically arranging tasks to avoid conflicts and optimize time"
  - term: "AI agent"
    definition: "Automated assistant that analyzes data and provides proactive tips"
  - term: "Work Life"
    definition: "Section for professional or job-related tasks"
  - term: "Social Life"
    definition: "Section for personal, social, or trip-related activities"
