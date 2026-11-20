# FinancialTherapy360.com - application source export

Exported: November 19, 2026, ~10:50 PM ET.
Requested by Lloyd Harrison. Private copy for the site owner.

## How this export was made

Every file was downloaded from the hosting account's own File Manager (Hostinger), so this is the complete contents of the webroot, not just the pages reachable over HTTP. As an integrity check, the five files that carry the current application state (client.js, login.html, contact.html, donations.html, config.json) were also fetched live over HTTPS with caching disabled: both routes produced byte-identical files, so this export matches what is running now.

## Contents: the full /public_html webroot (97 files)

Site root:
- index.html, about.html, how-it-works.html, free-review.html, faq.html, contact.html, donations.html, what-we-review.html, privacy.html, terms.html, account-notice.html, login.html, admin.html
- client.js (browser application bundle: questionnaire, dashboard, goals, auth), admin.js (admin application bundle), public-nav.js, auth.css, site.css
- config.json (client runtime configuration - see "Supabase configuration" below)
- counties.json (reference data used by forms)
- inquiry.php (contact/donation form endpoint), api.php (application API endpoint), default.php (hosting default page)
- Media: ft360-intro.mp4, ft360-intro-poster.jpg, ft360-intro-captions.vtt, logo.svg, favicon.ico, favicon.png, apple-touch-icon.png
- .htaccess (web server configuration)
- SHA256SUMS.txt (integrity hashes for all 97 files)

Subdirectories:
- assets/ - current site assets (inquiry.js, public.js, site.css, logo.svg)
- ft360-files/ - document-upload feature endpoint (api.php, .htaccess, .user.ini); the upload feature is off and this directory contains no uploaded documents
- preview/ - earlier preview build of the site (pages, assets, admin preview), including owner-trial/ (in-browser document/face analysis trial with third-party open-source libraries: face-api.js, TensorFlow.js, Tesseract, ZXing, and their model files)
- prototype/ - earliest prototype pages

## Deliberately excluded

- .htpasswd (117 bytes): contains HTTP basic-auth password hashes. Password material does not belong in a file export. It remains on the server unchanged.
- ft360_private/ (outside the webroot): holds the site's credential files. Not touched, not exported. Never copy its contents into any shared folder or repository.
- ft360_store/ (outside the webroot): separate storage directory, not part of the site source.
- No passwords, secret keys, or credentials of any kind are in this export. Keep it that way if you add it to a repository.

## Security and privacy scan

All 97 files were scanned before packaging:
- No API secrets, private keys, service-role keys, or hardcoded password values found. The password/key strings present in client.js and admin.js are documentation examples inside the bundled Supabase client library, not real values.
- The only email addresses present are the site's own public contact addresses and test-fixture addresses (email.com / example.com) already visible in the live public files.
- No customer records or submitted personal data are present.

## Supabase configuration (verified, non-secret)

- Project URL: https://plskvwcataoexupcysgo.supabase.co - public client configuration, verified in the live config.json included here.
- Public key: config.json's "key" is the project's publishable key (sb_publishable_ format - public by design, served to every site visitor). It is NOT the secret/service key; no secret key appears anywhere in these files (verified).
- Database schema / SQL migrations: NOT available in this export. The schema, database functions, and auth/storage settings live inside the Supabase project itself, and the site's server-side code reads its private Supabase settings from outside the webroot (ft360_private/). To get the schema: in the Supabase dashboard under your account, use the SQL Editor or Database views, or run `supabase db dump` with the CLI under your own login. That is also what to give a developer access to if you want them to have the backend.

## What is still not in this export

- The Supabase backend internals: database schema, functions (including the registration-config function), auth and storage configuration. See above for how to export those from your own Supabase project.
- Anything outside /public_html on the hosting account (noted under "Deliberately excluded").

## Notes

- The registration gate flags in config.json (enabled/testOnly) are the static defaults; the live site can also apply server-side registration settings at runtime, so this file alone does not prove the current open/closed state of public sign-up.
- preview/ and prototype/ are earlier builds kept on the live webroot. They are publicly reachable but not linked from the current site; a developer should treat only the root files and assets/ as current.
