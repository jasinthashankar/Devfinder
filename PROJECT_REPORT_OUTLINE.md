# Final Year Project Report Outline — DevFinder

**Anand Institute of Higher Technology, Department of Computer Science and Engineering**
**Batch 2023–2027**

## Chapter 1: Introduction
1.1 Background and motivation — time developers spend manually searching GitHub, job boards, and contribution opportunities across multiple sites
1.2 Problem statement
1.3 Objectives of the project
1.4 Scope of the project

## Chapter 2: Literature Survey
2.1 Existing platforms (GitHub Explore, LinkedIn Jobs, Up For Grabs, goodfirstissue.dev) and their limitations
2.2 Gap analysis — why no single platform combines repo discovery + AI analysis + job aggregation + alerts
2.3 Technologies surveyed (FastAPI vs Flask vs Django; Supabase vs Firebase vs raw PostgreSQL; Groq vs OpenAI vs Gemini for inference speed/cost)

## Chapter 3: System Analysis
3.1 Existing system and its drawbacks
3.2 Proposed system
3.3 Feasibility study (technical, economic, operational)
3.4 Software requirement specification (SRS)

## Chapter 4: System Design
4.1 System architecture diagram (React frontend ↔ FastAPI backend ↔ Supabase PostgreSQL, with GitHub API, Groq API, and SMTP as external integrations)
4.2 Database design — ER diagram for the 6 tables (users, repositories, jobs, alerts, saved_projects, searches)
4.3 API design — REST endpoint table (reproduce the 14-endpoint list from the spec)
4.4 Use case diagrams (register/login, search repositories, save project, create alert, admin view stats)
4.5 Data flow diagrams (Level 0 and Level 1)

## Chapter 5: Implementation
5.1 Backend implementation
   - JWT authentication flow with bcrypt password hashing
   - Supabase integration via the Python client (service_role key, RLS policies)
   - GitHub REST API integration for repository and issue search
   - Groq API integration for AI-generated repository analysis and skill-based ranking
   - APScheduler background job for 12-hour data refresh and alert checking
5.2 Frontend implementation
   - Component architecture (AppLayout, RepoCard, JobCard, FilterBar)
   - State management via React Context API (AuthContext, ToastContext)
   - Routing and protected routes with React Router
5.3 Key algorithms
   - Difficulty estimation fallback (rule-based) when AI is unavailable
   - Debounced search to reduce API calls
   - Pagination strategy (offset-based via Supabase `.range()`)

## Chapter 6: Testing
6.1 Unit testing approach (Pydantic validation, auth token expiry)
6.2 Integration testing (API endpoint response shapes via FastAPI TestClient)
6.3 Manual UI testing checklist (register → login → search → save → alert → logout)
6.4 Test cases table (input, expected output, actual output, pass/fail)

## Chapter 7: Results and Discussion
7.1 Screenshots of each page (Home, Repositories, Issues, Jobs, Internships, Recommendations, Alerts, Profile, Admin)
7.2 Sample AI-generated repository analysis output
7.3 Performance observations (GitHub API rate limits, Groq response latency)

## Chapter 8: Conclusion and Future Enhancements
8.1 Summary of objectives achieved
8.2 Limitations (no dedicated internship API; SMTP reliability depends on third-party mail provider)
8.3 Future enhancements — mobile app, Redis caching, more granular skill-matching, OAuth login

## References
List GitHub REST API docs, Groq API docs, Supabase docs, FastAPI docs, React docs, and any academic papers on recommendation systems if cited.

## Appendices
A. Full database schema (`schema.sql`)
B. Complete API endpoint reference
C. Installation steps (reproduce `INSTALLATION.md`)
