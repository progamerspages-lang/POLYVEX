# Firestore Security Specification — POLYVEX

## 1. Data Invariants
- A user document at `/users/{userId}` belongs strictly to the authenticated user where `request.auth.uid == userId`.
- No user can view, list, modify, or delete another user's profile, courses, timetable, tasks, practicals, reports, revision topics, or study resources.
- Blanket reads and public query listing on `/users` are strictly forbidden.
- Document IDs must conform to the alphanumeric/hyphen/underscore pattern and be at most 128 characters.
- String fields must have strict size bounds to prevent resource exhaustion attacks.
- Writes on subcollections require ownership of the parent user context (`request.auth.uid == userId`).

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Profile Read**: Anonymous/unauthenticated `GET /users/victim-123` -> PERMISSION_DENIED.
2. **Cross-User Profile Read**: User A (`auth.uid: user-A`) `GET /users/user-B` -> PERMISSION_DENIED.
3. **Public Users Enumeration**: User A `LIST /users` -> PERMISSION_DENIED.
4. **Cross-User Course Read**: User A `GET /users/user-B/courses/course-1` -> PERMISSION_DENIED.
5. **Cross-User Course Creation**: User A `CREATE /users/user-B/courses/course-hack` -> PERMISSION_DENIED.
6. **Cross-User Task Deletion**: User A `DELETE /users/user-B/tasks/task-1` -> PERMISSION_DENIED.
7. **Cross-User Lab Report Modification**: User A `UPDATE /users/user-B/reports/rep-1` -> PERMISSION_DENIED.
8. **Malicious ID Injection**: User A `CREATE /users/user-A/courses/../../../escaped` -> PERMISSION_DENIED (regex failure).
9. **Payload Bloat Attack**: User A sending 2MB string in task description -> PERMISSION_DENIED (`.size() <= 4000`).
10. **Immutable Field Tampering**: User A modifying `createdAt` or profile `uid` on update -> PERMISSION_DENIED.
11. **Profile Deletion Attack**: User A attempting `DELETE /users/user-A` -> PERMISSION_DENIED (profiles protected against deletion).
12. **Missing Required Fields**: User A creating a course missing `title` or `code` -> PERMISSION_DENIED.
