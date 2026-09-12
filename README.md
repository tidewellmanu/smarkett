# MarketHub Ghana — static Firebase marketplace

An original, mobile-first classifieds marketplace codebase using HTML5, CSS3 and vanilla JavaScript ES modules. It is designed to deploy as a static Firebase Hosting site with Firestore, Storage, Auth, App Check and a server-side phone-reveal function.

## Technology boundary

Frontend: HTML5 + CSS3 + vanilla JavaScript ES modules loaded from Firebase's browser CDN. No React, Vue, Angular, Svelte, TypeScript, JSX, TSX, Tailwind, Vite, Webpack, Parcel, Babel, npm or Node.js build process.

Backend: Firebase services. `functions/phone-reveal.js` is server-side and requires a supported Firebase Functions runtime. See its README.

## Setup

1. Create a Firebase project.
2. Enable Authentication providers you need: Email/Password, Google and Phone.
3. Create Firestore and Storage.
4. Configure `js/config.js` with your Firebase web app values and reCAPTCHA v3 App Check key.
5. Deploy Firestore rules, indexes and Storage rules.
6. Deploy the static directory to Firebase Hosting or another HTTPS static host.
7. Deploy the server-side phone reveal function.
8. Create an admin user and securely set its Firestore `users/{uid}.role` to `admin` using a trusted administrative path.
9. Run the reference-data seeder from a trusted admin-only context.
10. Replace `YOUR_DOMAIN` in `robots.txt` and `sitemap.xml`.
11. Update Terms/Privacy with your real legal/business details before launch.

## Data model

- `users/{uid}`: private account profile and role
- `listings/{listingId}`: public marketplace listing; seller phone must never be stored here
- `categories/{id}`, `locations/{id}`: public reference data
- `favorites/{id}`, `savedSearches/{id}`
- `conversations/{id}/messages/{messageId}`
- `notifications/{id}`
- `reports/{id}`, `reviews/{id}`
- `phoneReveals/{id}`, `auditLogs/{id}`, `moderationActions/{id}`

## Search

Firestore handles bounded token/category/location queries. `searchTokens` supports prefix-like token matching only for the first normalized search token. For high-scale fuzzy/full-text search, integrate a dedicated search service behind a controlled backend rather than downloading the entire listing collection to clients.

## Security

Public listing reads require `status == active` and country matching in the query. Firestore rules are not filters, so client queries must satisfy the rule conditions.

Seller phone numbers are protected behind a callable backend with App Check, authentication and rate limiting. Never expose the phone in listing JSON.

Storage limits images to 5 MB and common web image MIME types. Review and extend content moderation before accepting arbitrary user media.

## Production checklist

- [ ] Firebase config replaced
- [ ] App Check enabled and verified
- [ ] Email/Google/Phone auth configured
- [ ] Firestore rules deployed and tested in Emulator/Rules Playground
- [ ] Storage rules deployed and tested
- [ ] Required indexes deployed
- [ ] Admin account created through a trusted path
- [ ] Function deployed and App Check enforcement confirmed
- [ ] FCM push credentials/service worker configured
- [ ] Abuse/rate-limit monitoring enabled
- [ ] Image moderation enabled
- [ ] Legal pages reviewed
- [ ] Analytics/observability configured
- [ ] Accessibility audit completed
- [ ] Performance/mobile/network testing completed
- [ ] Backup/export and incident response procedures documented

## Country routing
Country selectors use internal `country.html?country=XX` routes. No external marketplace links are included. Purchased country domains can be connected later at the hosting/DNS layer.
