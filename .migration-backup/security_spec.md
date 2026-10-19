# Security Specification & Test Protocol

## 1. Data Invariants
1. **Identity & Ownership Invariant**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId` or an authorized platform administrator.
2. **Immutability of Critical Identity**: Once a user profile or purchase document is created, the owning `id` and `userId` cannot be tampered with or modified.
3. **Admin Gate Protection**: Admin access to platform settings (`/settings/*`), vouchers (`/vouchers/*`), plans modifications (`/plans/*`), and global user management requires verification via `/admins/{uid}` or authenticated admin credentials (`inaciosmithndava@gmail.com`).
4. **Transaction Integrity**: Users can submit transactions (e.g., recharge or withdrawal requests) only for themselves with `status == 'pendente'`, and cannot unilaterally approve (`concluido`) their own transactions or alter transaction amounts after submission.
5. **Purchase Validation**: A purchase can only be created by the authenticated user with status `'ativo'`, valid positive pricing matching plan parameters, and cannot tamper with days completed or payouts upon creation.
6. **Chat Message Integrity**: Chat messages in `/messages/{messageId}` require the `senderId` to match the current authenticated user (`request.auth.uid`) or admin, and cannot be spoofed to impersonate other users.
7. **Size & Type Defense**: All text fields have strict length boundaries (`.size() <= MAX`) to prevent Denial-of-Wallet and resource exhaustion attacks.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Attack Vectors)

1. **Payload 1 (Ghost Field Injection / Shadow Update)**: An unprivileged user attempts to update their profile with an unapproved field `{ "role": "admin", "balance": 999999 }`.
2. **Payload 2 (Identity Spoofing on Purchase Creation)**: Attacker attempts to create a purchase with `userId: "victim-uid-123"` instead of their own UID.
3. **Payload 3 (Self-Approval on Withdrawal)**: Attacker submits a withdrawal transaction with `{ "status": "concluido" }` bypassing administrative review.
4. **Payload 4 (Denial-of-Wallet Long String Attack)**: Attacker attempts to write a 1MB payload to a user profile or chat message field exceeding `maxLength`.
5. **Payload 5 (Unauthenticated Profile Read)**: Anonymous or unauthenticated actor attempts to read `/users/sensitive-profile-id`.
6. **Payload 6 (Admin Privilege Escalation via Claims)**: Attacker sends mock token claims claiming `admin: true` without being registered in `/admins/{uid}`.
7. **Payload 7 (Orphaned Write Attack)**: Attacker creates a transaction without an existing valid user account.
8. **Payload 8 (State Shortcutting on Purchases)**: Attacker tries to modify a completed purchase back to active or artificially bump `daysCompleted` to 1000.
9. **Payload 9 (Unauthorized Setting Alteration)**: Non-admin user attempts to change payment numbers or platform fees in `/settings/global`.
10. **Payload 10 (Chat Sender Spoofing)**: Attacker posts a message with `senderRole: "admin"` and `senderId: "official-admin"` from a regular user account.
11. **Payload 11 (Voucher Creation Exploitation)**: Non-admin user attempts to create a high-value voucher code directly in `/vouchers`.
12. **Payload 12 (Negative Balance/Amount Exploit)**: Attacker attempts to create a transaction or purchase with a negative amount (`amount: -5000`) to reverse debit flows.

---

## 3. The Test Runner Reference (firestore.rules.test.ts)
All 12 adversarial attack payloads are systematically targeted by the hardened rules with `PERMISSION_DENIED` expected on all illegal writes and reads.
