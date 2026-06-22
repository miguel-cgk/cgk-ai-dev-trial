# Operations Triage

A small authenticated tool for logging incoming operational Requests and triaging them — classifying, prioritizing, and assigning them so the right person handles the right thing first.

## Language

### Core records

**Request**:
A single unit of operational work that someone needs handled. The central record of the app.
_Avoid_: ticket, issue, task, case

**Note**:
A free-text comment added to a Request by an authenticated user.
_Avoid_: comment, message

**Activity**:
An immutable record of a meaningful change to a Request (created, status/priority/owner changed, or a Note added). The Request's history.
_Avoid_: history, audit log, event log, trail

### People

**Requester**:
The person who needs the help described in a Request. Usually not a user of this app, so captured as free text.
_Avoid_: customer, client, user (in this sense)

**Owner**:
The authenticated user assigned to handle a Request. A Request may be unassigned (no Owner).
_Avoid_: assignee, agent, handler

**Creator**:
The authenticated user who logged the Request. Often different from the Requester.
_Avoid_: reporter; author (reserve "author" for Notes)

### Classification

**Status**:
Where a Request sits in its lifecycle. Triage → In Progress → Blocked → Resolved is the conventional flow, but any Status can move to any other — the order is a convention, not an enforced sequence (there is no separate "reopen").
_Avoid_: state, stage

**Priority**:
How urgently a Request should be handled (Low / Medium / High / Urgent).

**Category**:
The kind of Request, used for routing and filtering (e.g. Access, Incident, Data, Question, Other).
_Avoid_: type, tag

### Triage

**Triage**:
Assessing an incoming Request and setting its Priority, Category, and Owner so work is handled in the right order.

**Triage helper**:
A small recommendation engine that suggests a Priority and Category for a Request from its content, with human-readable reasons and a Confidence. The human always decides.
_Avoid_: AI assistant, bot, classifier

**Confidence**:
How strongly the Triage helper's signals back its suggestion (Low / Medium / High). Low means it is essentially a baseline guess with no strong signal; High means a clear Category match plus an urgency signal.
_Avoid_: score, certainty, probability
