# VocabFlow Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every user document and subcollection (`/users/{userId}/**`) is strictly readable and writable only by the authenticated user whose `request.auth.uid == userId`. No cross-user reads or blanket `isSignedIn()` reads exist.
2. **Server-Authoritative Subscriptions**: `/users/{userId}/billing/subscription` is strictly `allow write: if false;` on the client. Clients can read their own subscription status, but only verified server payment/webhook flows can grant or modify Premium status.
3. **Immutable Ownership & Timestamps**: `uid` and `createdAt` are immutable after document creation. All `createdAt` and `updatedAt` timestamps must match `request.time`.
4. **Strict Field Allowlisting & Size Bounds**: Every `create` checks both `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` checks `affectedKeys().hasOnly(...)` and validates the full incoming entity via `isValid[Entity](incoming())`. Every string and list enforces explicit `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Profile Read**: Authenticated User B calls `get(/users/userA)` -> DENIED (`isOwner(userId)` fails).
2. **Client-Side Premium Spoof**: User A writes `{ tier: "premium", status: "active" }` to `/users/userA/billing/subscription` -> DENIED (`allow write: if false`).
3. **Shadow Field Injection on Profile**: User A creates `/users/userA` with `{ ..., isPremium: true, role: "admin" }` -> DENIED (`hasOnly` rejects unknown keys).
4. **Owner UID Spoofing**: User A creates `/users/userA/collections/col1` with `uid: "userB"` -> DENIED (`data.uid == request.auth.uid` fails).
5. **1MB ID Poisoning**: User A writes to `/users/userA/wordProgress/<1500-char-id>` -> DENIED (`isValidId(wordId)` enforces `size() <= 128` and regex).
6. **1MB String Exhaustion**: User A creates a collection with a 50KB `name` string -> DENIED (`data.name.size() <= 60`).
7. **Unbounded Array Exhaustion**: User A updates `collections/col1` with 5,000 `wordIds` -> DENIED (`data.wordIds.size() <= 200`).
8. **Array Element Type Poisoning**: User A sets `wordIds: [12345]` -> DENIED (`data.wordIds[0] is string`).
9. **Client Timestamp Forgery**: User A sets `createdAt: Timestamp(2099-01-01)` -> DENIED (`incoming().createdAt == request.time`).
10. **Immutable Field Mutation**: User A updates `collections/col1` and changes `createdAt` or `collectionId` -> DENIED (`affectedKeys().hasOnly(...)` and immutability check).
11. **Wildcard Collection Probe**: User A queries `/admin/config` or `/test/anything` -> DENIED (global `match /{document=**} { allow read, write: if false; }`).
12. **Unauthenticated Write**: Unauthenticated client writes to `/users/guest/wordProgress/w1` -> DENIED (`isSignedIn()` fails).
