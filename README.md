# MHP Clinic

Patient records, homeopathic prescriptions and medicine inventory for a single-doctor clinic.
Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · MongoDB Atlas + Mongoose · deployed on Vercel.

- [Run locally](#run-locally)
- [Deploy to Vercel](#deploy-to-vercel)
- [Backups](#backups)
- [Security](#security)
- [Project layout](#project-layout)

---

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI`: Atlas connection string **including the database name** (`…mongodb.net/mhp?…`)
   - `AUTH_SECRET`: secret that signs the login session (JWT), at least 32 characters.
     Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`: the doctor's login, used only by the seed script
3. Create the admin login: `npm run seed -- --no-samples`
   (leave `SEED_ADMIN_PASSWORD` empty to have a strong one generated and printed once).
   Re-run with a new `SEED_ADMIN_PASSWORD` any time to reset the password, then clear it from the file.
4. `npm run dev` → http://localhost:3000

> Development and production share **one** database. Never run `npm run seed` without `--no-samples`
> once real patients exist, and never point tests at it.

> If `mongodb+srv://` fails locally with `querySrv ECONNREFUSED`, your DNS server can't resolve SRV
> records. Use Atlas's standard connection string (Connect → Drivers → turn off "SRV") instead.

---

## Deploy to Vercel

### 1. Prepare MongoDB Atlas

1. **Database user with minimal rights.** Atlas → *Security → Database Access* → edit your app user →
   *Built-in Role / Specific Privileges* → `readWrite` on database **`mhp`** only (not "Atlas admin").
   Use a long random password (letters and digits only, so it needs no URL-encoding).
2. **Network access.** Atlas → *Security → Network Access* → *Add IP Address* → **`0.0.0.0/0`**
   ("Allow access from anywhere"). Vercel functions run on changing IP addresses, so there is no
   fixed list to allow. The database is still protected by the user/password and TLS.
   (Fixed egress IPs need Vercel's paid *Secure Compute*; then allow only those.)
3. **Note your cluster's region** (Atlas → *Database* → cluster card, e.g. `AWS Mumbai ap-south-1`).
   You will run Vercel functions in the same region for speed.
4. **Get the connection string.** *Database → Connect → Drivers* → copy the `mongodb+srv://…` string,
   put your password in, and add the database name before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mhp?retryWrites=true&w=majority&appName=Cluster0
   ```

### 2. Put the code on GitHub

`.env.local` is in `.gitignore`, so secrets are never committed. Check with `git status` before pushing.

```bash
git init
git add .
git commit -m "MHP Clinic"
# create an EMPTY *private* repository on github.com, then:
git remote add origin https://github.com/<you>/mhp-clinic.git
git branch -M main
git push -u origin main
```

### 3. Create the Vercel project

1. https://vercel.com/new → **Import** the GitHub repository. Framework: **Next.js** (auto-detected).
   Keep the default build settings.
2. **Environment Variables** (add for *Production*, and *Preview* if you use preview deploys):

   | Name | Value | Required |
   |---|---|---|
   | `MONGODB_URI` | the `mongodb+srv://…/mhp?…` string from step 1.4 | yes |
   | `AUTH_SECRET` | a **new** 32+ character random string (the JWT signing secret) | yes |
   | `CLINIC_NAME`, `CLINIC_ADDRESS`, `CLINIC_PHONE`, `DOCTOR_NAME`, `DOCTOR_QUALIFICATIONS`, `DOCTOR_REG_NO` | letterhead for printed prescriptions | optional |
   | `CRON_SECRET`, `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`, `APP_URL` | daily expiry email (see below) | optional |

   Do **not** add `SEED_ADMIN_*`; the seed script runs from your PC, not on Vercel.
3. **Deploy.**
4. **Function region:** Project → *Settings → Functions → Function Region* → choose the region closest
   to your Atlas cluster (e.g. Mumbai `bom1` for `ap-south-1`), then redeploy. This removes a round-trip
   to another continent on every page load.

### 4. Check it

1. Open `https://<project>.vercel.app` → you should land on **/login**.
2. Sign in with the admin email/password you created with the seed script.
3. Add a test patient, then delete it.
4. Optional custom domain: Project → *Settings → Domains*.

**Troubleshooting:** a page shows "Something went wrong" → Vercel → *Logs*.
`MongoServerSelectionError` usually means Network Access is missing `0.0.0.0/0` or the password in
`MONGODB_URI` is wrong. "AUTH_SECRET must be set" means the variable is missing or under 32 characters.
After changing any environment variable, **redeploy** (Deployments → ⋯ → Redeploy).

### 5. Optional: daily expiry email

`vercel.json` schedules `/api/cron/expiry-report` every day at 03:00 UTC (08:00 PKT).

1. Create a free https://resend.com account and verify your domain (or use `onboarding@resend.dev`,
   which only delivers to your own Resend account email).
2. Add to Vercel: `CRON_SECRET` (random string), `RESEND_API_KEY`, `ALERT_EMAIL_TO` (your email),
   `ALERT_EMAIL_FROM` (e.g. `MHP Clinic <alerts@yourdomain.com>`), and redeploy.
3. Test: `curl -H "Authorization: Bearer <CRON_SECRET>" "https://<app>/api/cron/expiry-report?force=1"`

---

## Backups

**The free Atlas tier (M0) has no automatic backups or restorable snapshots.** If data is deleted
or corrupted, Atlas cannot bring it back. Make your own backups.

### Option A: `mongodump` (full backup; recommended weekly)

1. Install **MongoDB Database Tools**: https://www.mongodb.com/try/download/database-tools
   (Windows: download the `.msi`, or `winget install MongoDB.DatabaseTools`).
   Check with `mongodump --version` in a new terminal.
2. Back up (use the same connection string as `MONGODB_URI`, in quotes):
   ```bash
   mongodump --uri="<MONGODB_URI>" --gzip --archive=mhp-backup-2026-11-13.gz
   ```
   This writes one compressed file containing every collection: patients, visits, medicines, admins, counters.
3. Keep copies **off this PC** (Google Drive, USB stick). Patient data is sensitive: keep the files private.
4. **Test a restore** into a scratch database now and then, without touching the real one:
   ```bash
   mongorestore --uri="<MONGODB_URI>" --gzip --archive=mhp-backup-2026-11-13.gz \
     --nsFrom="mhp.*" --nsTo="mhp_restoretest.*"
   ```
   Check the data in Atlas → *Browse Collections*, then drop `mhp_restoretest`.
5. **Real restore** (overwrites the live data with the backup; only when you mean it):
   ```bash
   mongorestore --uri="<MONGODB_URI>" --gzip --archive=mhp-backup-YYYY-MM-DD.gz --drop
   ```

To automate on Windows: put the `mongodump` line in a `.bat` file and schedule it in **Task Scheduler**
(weekly). Don't save the password in a file that syncs to the cloud.

### Option B: CSV export (quick, human-readable)

Patients page or Medicines page → **Export CSV** → *Patients*, *Visits & prescriptions*, or
*Medicines & batches*. These open in Excel / Google Sheets.
They are good for reports and a readable copy, **but they are not a full backup**: they cannot be
restored into the app. Use `mongodump` for that.

> Excel drops the leading `0` from mobile numbers when it opens a CSV. To keep it, use Google Sheets,
> or in Excel use *Data → From Text/CSV* and set the Mobile column to *Text*.

### Option C: paid tier

Upgrading the cluster (Atlas **Flex** or a dedicated **M10+**) adds automatic snapshots that Atlas can
restore for you. Check the current retention and price on Atlas's pricing page.

---

## Security

What protects the app, and what was checked:

- **Every route needs a login.** `proxy.ts` redirects anything except `/login` (and the cron endpoint,
  which checks its own secret) to the login page. Every page layout, every server action that reads or
  changes data, the print page and the CSV export also check the session themselves, so one mistake
  can't expose data.
- **Passwords:** bcrypt (cost 12). Sessions: signed JWT (HS256, `AUTH_SECRET`) in an `HttpOnly`,
  `Secure`, `SameSite=Lax` cookie, valid 12 hours.
- **Brute-force protection:** 10 failed logins from one IP lock that IP out for 15 minutes
  (stored in MongoDB so it works across Vercel instances; entries expire on their own).
- **CSRF:** server actions only accept POSTs whose `Origin` matches the site; cookies are `SameSite=Lax`.
- **Input validation:** every form is validated with zod on the server: formats (CNIC, mobile, real
  calendar dates), length limits, max 30 medicines per visit. Unknown fields are dropped.
- **NoSQL injection:** queries are only built from validated strings/numbers. Objects such as
  `{"$ne": null}` are rejected by validation, search text is regex-escaped, and IDs must be 24-hex
  ObjectIds before use.
- **Open redirects:** the post-login `?from=` value is resolved like a browser would and must stay on this site.
- **CSV exports:** cells that start with `= + - @` are prefixed with `'`, so a malicious name can't run
  as a spreadsheet formula. Responses are `no-store`.
- **Headers:** `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.

Good habits:

- Use a unique, strong admin password and change it if it was ever shared.
- Rotate the Atlas database password if it was ever shared (Database Access → Edit → new password,
  then update `MONGODB_URI` in `.env.local` and in Vercel, and redeploy).
- Changing `AUTH_SECRET` in Vercel signs everyone out immediately. Use it if a device is lost.

- **Settings** (sidebar → Settings): change your name, sign-in email (needs the current password) and
  password (needs the current password). Changing the password signs out every other device: each request
  checks that the session was issued after the last password change.

Known limits (fine for a single-doctor clinic, worth knowing):

- No Content-Security-Policy header yet.

---

## Project layout

```
proxy.ts                          Route guard (Next 16's "middleware"): login required except /login, /api/cron
lib/db.ts                         Cached Mongoose connection (one per serverless instance / dev hot reload)
lib/auth.ts                       Session JWT (jose) + cookie options + safe post-login redirect
lib/session.ts                    getSession() / requireAdmin()
lib/validation.ts                 zod schemas (patients, visits, batches…), CNIC/mobile normalisation
lib/queries.ts                    Reads for pages; return plain serialisable objects (.lean())
lib/batches.ts                    Batch writes: $push / positional $set / $pull
lib/expiry.ts                     Expiry report aggregation ($unwind batches, 90-day window)
lib/export.ts, lib/csv.ts         CSV exports (patients, visits, medicines) with injection-safe escaping
models/                           Admin, Patient, Visit (embedded prescription), Medicine (embedded batches),
                                  Counter (patient #), LoginAttempt (brute-force lockout, TTL)
app/actions/                      Server actions: auth, patients, visits, medicines
app/login/                        Login page
app/(app)/                        Signed-in app: dashboard, patients, search, visits, medicines, alerts
app/(print)/visits/[id]/print     A5 printable prescription
app/api/export/[type]/route.ts    CSV download (login required)
app/api/cron/expiry-report/       Daily expiry email (Vercel Cron, CRON_SECRET)
scripts/seed.ts                   Admin user + optional sample data; syncs indexes
components/ui/                    shadcn/ui components
components/                       App shell (sidebar), forms, lists, dialogs
```

## Notes

- Patients need a CNIC (`12345-1234567-1`) **or** a mobile (`03XXXXXXXXX`); each is unique when present.
  Input like `1234512345671` or `+92 300 1234567` is normalised automatically.
- Each patient gets a sequential number (#1, #2, …) for quick search.
- Dates are stored as UTC midnight (date only) and follow the Pakistan calendar day.
