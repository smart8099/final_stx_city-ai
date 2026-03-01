# CityAssist — Feature Overview

## What is CityAssist?

CityAssist is an AI-powered civic chatbot platform that helps city governments manage resident conversations, route inquiries to the right departments, and track everything through an admin dashboard. Each city (organization) gets their own isolated workspace with full control over their chatbot, departments, knowledge base, and team.

---

## Authentication & Multi-Tenancy

### Clerk Authentication
- Sign in / Sign up via Clerk with modal-based popups (centered, minimalistic design)
- Organization-based multi-tenancy — each city team operates in their own isolated workspace
- URL-based tenant isolation: `/dashboard/{org-slug}/...`
- All data (conversations, departments, settings) is scoped per organization using localStorage keys

### Role-Based Access Control
- **Admin**: Full access — can invite members, manage organization settings, delete accounts, and see all security options
- **Member**: Dashboard access — can view and manage conversations, knowledge base, and departments, but cannot delete accounts
- Role label (Admin/Member) displayed in the sidebar under the organization switcher
- Security tab (with Delete Account) is completely hidden for members — they can still access their profile to update name, email, etc.

### Auto-Redirect for Invited Users
- When a user is invited and accepts, they are automatically redirected to the dashboard — no manual org selection needed
- Users without an organization see a clean "Waiting for access" screen with a spinner
- The app auto-selects the first organization and redirects seamlessly

---

## Dashboard Navigation

A persistent sidebar with five main sections:
1. **Conversations** — Ticket management system
2. **Departments** — Department configuration with members and routing keywords
3. **Knowledge Base** — Document uploads and FAQ management
4. **Analytics** — Live metrics and charts
5. **Settings** — Widget branding and configuration

The sidebar also includes:
- Organization switcher (Clerk-powered, admin can manage org settings via modal)
- User profile button with sign out
- Role badge (Admin/Member)

---

## Conversations (Ticket Management)

### Three-Panel Layout
- **Left Sidebar**: Quick views + status filters + department filters
- **Center**: Ticket table with search, bulk actions, and pagination
- **Right** (on click): Full ticket detail panel with conversation thread

### Quick Views
- **My Tickets** — Shows only tickets assigned to the current logged-in user
- **Recently Viewed** — Shows tickets the user has clicked on in the last 24 hours

### Status Filters
- **All Tickets** — Every conversation regardless of status
- **Escalated** — Conversations flagged for human attention
- **Solved** — Completed conversations

### Department Filters
- **Unassigned** — Conversations not yet routed to a department
- Each configured department appears as a filter with ticket count badges

### Ticket Table
- Columns: Status, Subject, Requester, Intent, Department, Assignee, Priority, Requested
- **Search bar** — Filters tickets in real-time by subject, ID, or department
- **Bulk actions** — Checkbox selection with select-all; bulk Set Status and Set Priority via dropdown menus
- **Priority badges** — Urgent (red), High (orange), Normal (hidden for cleanliness), Low (gray)
- **Dynamic pagination** — Automatically calculates how many rows fit the viewport and paginates accordingly
- Thin, Zendesk-style rows with minimal padding

### Ticket Detail Panel (Zendesk-Style)
Opens when clicking a ticket. Two-column layout:

**Left Sidebar (Properties):**
- Status dropdown (Escalated / Solved)
- Department dropdown (populated from configured departments)
- Assignee dropdown (filtered by department members — only shows members belonging to the ticket's department)
- Priority dropdown (Urgent / High / Normal / Low)
- Intent (read-only, AI-classified)
- Requester info and Conversation ID
- Created and Updated timestamps
- Message count
- **Internal Notes** — Collapsible section with yellow sticky-note style cards; add notes with author name and timestamp; notes persist across sessions

**Right Panel (Conversation):**
- Full conversation thread with user messages (blue) and assistant messages (white)
- Intent and department badges on assistant messages
- Source references when available
- Escalation banner for escalated tickets
- **Admin Reply** — Text input at the bottom of the thread; type a reply and it appears in the conversation as an assistant message
- **Macros** — Lightning bolt button opens a popover to manage and use saved response templates; create macros with title + content; click a macro to fill the reply input; delete macros inline

### CSV Export
- Download button in the top-right of the table area
- Exports the currently filtered conversations as a CSV file
- Columns: ID, Status, Priority, Department, Intent, Subject, Messages, Created, Updated

---

## Departments

### Department Configuration
- Add departments with name, contact email, and contact phone
- All fields required with validation — "Department name is required", "Contact email is required", "Contact phone is required"
- Email validation (format check) and phone auto-formatting as you type: `(XXX) XXX-XXXX`
- Phone validation (10-15 digits)
- Edit and delete departments

### Routing Keywords
- Add keywords per department that the AI uses to automatically route conversations
- Keywords displayed as chips/badges; removable in edit mode

### Department Members
- Add members to each department with First Name, Last Name, and Email
- Per-field validation: "First name is required", "Last name is required", "Invalid email format" — each error shows under its respective input
- Duplicate email detection
- Members displayed as rows with name + email + remove button
- These members appear in the Assignee dropdown when viewing tickets for that department

---

## Knowledge Base

### Document Upload
- Drag & drop zone for PDF and TXT files
- Files are uploaded per department and processed via the `/api/upload` endpoint
- Status tracking: Processing, Ingested, Failed
- File details: name, department, size, upload date
- Delete uploaded documents

### Manual FAQs
- Add question/answer pairs assigned to a department
- **Edit FAQs** — Click the pencil icon to inline-edit the question, answer, and department
- Delete FAQs
- Filter FAQs by department using the department dropdown

---

## Analytics

All metrics are **live** — calculated from actual conversation data in real-time:

- **Stat Cards**: Total conversations, resolution rate (%), escalation rate (% — persists even after tickets are solved), average messages per conversation
- **Department Breakdown**: Shows how many conversations each department handles
- **Intent Breakdown**: Distribution of AI-classified intent types (Info Request, Process Guidance, Complaint, Emergency, Out of Scope)
- **Recent Questions**: Latest 10 conversations with status badges
- **Escalated Tickets**: Conversations flagged for human attention

---

## Settings

### Branding
- **City Name** — Displayed in the chat widget header
- **Primary Color** — Color picker that updates the widget header, send button, and user message bubbles in real-time
- **Welcome Message** — Shown when the chat widget is first opened
- **Logo URL** — Displayed in the widget header

### Widget Configuration
- **Auto-open widget** toggle — Widget opens automatically when the page loads
- **Show department badge** toggle — Shows/hides department badges on AI responses in the widget

### Live Widget Preview
- Real-time preview of the chat widget with current branding settings applied
- Shows mock conversation with sample user question and assistant response
- Updates instantly as you change colors, name, logo, or welcome message

### Embed Code
- Copy-paste script snippet for embedding the CityAssist widget on any external website
- Includes the API key and primary color in the snippet

### API Key
- View/copy authentication key with show/hide toggle

---

## Chat Widget

A floating chat button appears on **every dashboard page** (bottom-right corner):

- Opens a chat window powered by Groq AI (Llama 3.3-70b model)
- Uses branding from Settings (color, name, logo, welcome message)
- Shows department badges on responses (if enabled)
- Creates a new conversation in the ticket system for every chat session
- Auto-resolves conversations when the AI fully answers the question
- New chat button to start fresh conversations
- Emergency detection — automatically escalates tickets when urgent issues are detected

---

## AI Capabilities

### Intent Classification
Every message is classified into one of five intents:
- **Info Request** — Resident wants to know something ("What are the library hours?")
- **Process Guidance** — Resident needs help with a process ("How do I apply for a building permit?")
- **Complaint** — Resident is reporting an issue ("There's a pothole on Main Street")
- **Emergency** — Urgent issue, auto-escalates the ticket ("There's a gas leak at 5th and Oak")
- **Out of Scope** — Not related to city services ("What's the weather tomorrow?")

### Department Routing
The AI automatically routes conversations to the correct department based on configured routing keywords.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | Chakra UI |
| Auth | Clerk (organizations, roles, invites) |
| AI | Groq SDK with Llama 3.3-70b |
| State | React Context + localStorage (per-tenant) |
| Middleware | Next.js middleware for route protection |
