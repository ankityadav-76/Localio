# Localio

Localio is a prototype for discovering trusted local places, reading and writing
reviews, and supporting local businesses. This repository contains the Expo
mobile app and its FastAPI backend.

> **Prototype notice:** Authentication uses a development OTP flow, write
> endpoints are not protected by production authentication, and review/business
> photo storage is not implemented. Do not use this project with real customer
> data or live payments without completing the security and production work
> documented below.

## Project structure

| Directory | Description | Documentation |
|---|---|---|
| [`localio-app/`](./localio-app/) | React Native app built with Expo and TypeScript | [App setup and screens](./localio-app/README.md) |
| [`localio-backend/`](./localio-backend/) | FastAPI API, SQLModel data layer, and SQLite prototype database | [Backend setup and API](./localio-backend/README.md) |

## Requirements

- Node.js and npm
- Python 3.10 or newer
- Android device/emulator for Android development; iOS simulator requires macOS

## Run locally (Windows PowerShell)

Open two terminals from the repository root.

### 1. Start the backend

```powershell
cd .\localio-backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at <http://127.0.0.1:8000>; interactive API documentation is at
<http://127.0.0.1:8000/docs>. Allow Python through Windows Firewall on private
networks if a physical phone cannot reach the backend.

### 2. Start the mobile app

```powershell
cd .\localio-app
npm ci
npx expo start
```

For local development, the app discovers the machine running Metro and assumes
the backend is on port 8000. To use a deployed backend, copy
[`localio-app/.env.example`](./localio-app/.env.example) to
`localio-app/.env` and set `EXPO_PUBLIC_API_BASE` to its URL. Environment files
are ignored by Git; never put private keys in `EXPO_PUBLIC_*` variables.

Razorpay checkout requires a native development/preview build; it does not run
inside Expo Go. Configure Razorpay test keys in the backend process only. See
the [backend README](./localio-backend/README.md) for the PowerShell commands.

## Tests and checks

Run the app's TypeScript check:

```powershell
cd .\localio-app
npm ci
npm run typecheck
```

The backend includes [`localio-backend/smoke_test.py`](./localio-backend/smoke_test.py)
for an end-to-end API smoke test. Start the backend first; the script exercises
the running API and writes sample data to its configured database.

## Before production use

This repository is a prototype, not a production-ready service. In particular:

- Replace the development OTP flow with a trusted phone-auth provider and issue
  signed access tokens. Derive the acting user from the verified token rather
  than accepting a client-supplied `user_id`.
- Protect all write and vendor endpoints with authorization checks.
- Configure a production database, migrations, backups, and operational
  monitoring.
- Implement and secure photo uploads.
- Complete payment lifecycle handling, including notifications, refunds, and
  operational reconciliation. Use test keys until the integration is reviewed.
- Use HTTPS for deployed backends and keep all private credentials in a secret
  manager or deployment environment, never in source control.
- Review the platform permissions, privacy disclosures, and applicable legal
  requirements before collecting user or location data.

## License

This project is licensed under the MIT License; see [`LICENSE`](./LICENSE).
