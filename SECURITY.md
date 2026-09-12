# Security notes

## Non-negotiables

1. Do not place service-account credentials in this repository.
2. Do not put seller phone numbers in public listing documents.
3. Do not allow clients to assign themselves `admin`.
4. Do not use unrestricted `allow read, write: if true` rules.
5. Keep App Check enabled in production.
6. Validate uploaded content by size and MIME type at minimum; add malware/image moderation for production.
7. Rate-limit OTP, messaging, reports and phone reveals using backend controls.
8. Monitor Firestore/Storage costs and abuse.
9. Test rules with the Firebase Emulator before production.
10. Treat legal/privacy text in this starter as placeholders until reviewed.

## Threat model

Primary threats include account takeover, OTP abuse, fake listings, payment scams, scraping, phone-number harvesting, malicious uploads, spam messages, privilege escalation and Firestore cost abuse.

The architecture reduces exposure by separating private user data from public listings, enforcing ownership in Firestore rules, limiting storage writes, requiring authentication for sensitive actions, and using a backend callable for phone reveal.

## Admin access

Admin role is a trusted-server/console operation. The browser must never expose an admin role editor.

## Auditing

Moderation actions and phone reveals should be written by trusted backend code. Client writes to `auditLogs` and `moderationActions` are denied.

## Reporting vulnerabilities

Configure a real security contact address before launch. Do not publish credentials, private user information or exploit details in public issue trackers.
