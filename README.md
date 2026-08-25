# Places — API Backend

REST API for the Places app: users share, edit and map geotagged places. Node.js
and Express over MongoDB Atlas, with JWT auth and geocoding.

The React client lives in [PlacesFrontend](https://github.com/FardeenCODEIIEST/PlacesFrontend).

## Stack

| | |
|---|---|
| Runtime | Node.js, Express 4 |
| Database | MongoDB Atlas via Mongoose 8 |
| Auth | JSON Web Tokens, `bcryptjs` password hashing |
| Validation | `express-validator` |
| Geocoding | external location API (`utils/location.js`) |
| Images | uploaded client-side to Supabase Storage; the API stores only the URL |

## Layout

```
app.js                  express setup, CORS, error handling, DB connect, listen
routes/
  places-routes.js      /api/places
  users-routes.js       /api/users
controllers/
  places-controller.js  place CRUD, ownership checks, transactional writes
  user-controller.js    signup, login, token issue
middleware/
  check-auth.js         verifies the Bearer token, attaches userData
  file-upload.js        legacy multer disk upload — wired out, see Notes
models/
  place.js  user.js     mongoose schemas
  http-error.js         error type carrying an HTTP status code
utils/
  location.js           address -> coordinates
```

## API

All routes are prefixed `/api`. Routes marked 🔒 require `Authorization: Bearer <token>`.

### Users — `/api/users`

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/` | — | all users (without passwords) |
| `POST` | `/signup` | `name`, `email`, `password`, `image` | user + JWT |
| `POST` | `/login` | `email`, `password` | user + JWT |

### Places — `/api/places`

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/:pid` | — | one place |
| `GET` | `/user/:uid` | — | all places for a user |
| `POST` | 🔒 `/` | `title`, `description`, `address`, `image` | created place |
| `PATCH` | 🔒 `/:pid` | `title`, `description` | updated place |
| `DELETE` | 🔒 `/:pid` | — | confirmation |

Creating and deleting a place writes to both the `places` and `users`
collections inside a **Mongoose transaction**, so a failure rolls back rather
than orphaning a reference.

Errors return `{ "message": "..." }` with the status carried by `HttpError`.

## Running locally

```bash
npm install
cp .env.example .env     # then fill it in
npm start                # http://localhost:5000
```

### Environment

`.env` is gitignored. Required:

| Variable | Purpose |
|---|---|
| `DB_USER` | MongoDB Atlas username |
| `DB_PASSWORD` | MongoDB Atlas password |
| `DB_NAME` | database name |
| `JWT_KEY` | secret for signing tokens |
| `LOCATION_API_KEY` | geocoding API key |
| `PORT` | optional; defaults to `5000` |

The Atlas connection string is assembled in `app.js` and currently hard-codes
the cluster host `cluster0.ub4hkns.mongodb.net`. Change it there if you point at
a different cluster.

## Deploying

The service reads `process.env.PORT`, which is what Render, Railway, Heroku and
similar platforms require — they assign a port at runtime and route external
traffic to it. A hard-coded port makes the service unreachable regardless of how
healthy the process is.

If the database connection fails the process exits with status 1 rather than
logging and idling, so the platform surfaces a failed deploy instead of a
running container with no listening socket.

Checklist for a fresh deploy:

1. Set all five environment variables in the platform dashboard.
2. Leave `PORT` unset — the platform supplies it.
3. Allow the platform's egress in **MongoDB Atlas → Network Access**. Managed
   hosts use dynamic IPs, so a single-IP allowlist will fail intermittently.
4. Set the frontend's `REACT_APP_BACKEND_URL` to the deployed origin.

## Notes

**Image uploads moved to the client.** The API accepts an `image` URL in the
request body; the browser uploads the file to Supabase Storage directly. The
multer disk-upload path (`middleware/file-upload.js`, the `/uploads/images`
static route, and the `fs.unlink` rollback in the error handler) is left in
place but wired out of the routes. It would not survive a managed host anyway —
their filesystems are ephemeral, so uploads vanish on redeploy.

**CORS is open.** `Access-Control-Allow-Origin: *` suits a portfolio project;
restrict it to the frontend origin before anything real.
