# Deployment notes

The frontend is static and package-free.

Country navigation is entirely internal:
`country.html?country=GH`, `country.html?country=ZA`, etc.

No external marketplace links are used. Purchased country domains can later be mapped through DNS/Firebase Hosting to the appropriate country routes.

The country list is at the bottom of the site and contains text only.

The homepage banner begins directly with the search form. Banner marketing copy/writeups were removed.

The server-side phone-reveal function remains separate because seller phone numbers must not be exposed to client code.


## Production domain

Use `https://smarkett.vercel.app` as the production application URL. Add `smarkett.vercel.app` to Firebase Authentication → Settings → Authorized domains before testing Google sign-in, phone OTP, email verification, or password reset.
