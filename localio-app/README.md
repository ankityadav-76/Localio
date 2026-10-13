# Localio mobile app (Expo)

React Native + Expo (SDK 57) + TypeScript + Expo Router. Talks to the same FastAPI
backend as the web app. One app, one codebase for Android and iOS.

## Run it (Windows PowerShell)

```powershell
# 1. Backend: bind to all interfaces so your phone can reach it
cd ..\localio-backend
venv\Scripts\Activate.ps1
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. App (new terminal)
cd ..\localio-app
npm install
npx expo start
```

For screens that don't use payments, scan the QR code with **Expo Go** (Android)
or the Camera app (iOS). Phone and laptop must be on the same Wi-Fi. If the phone
can't connect, allow Python through Windows Firewall when prompted (private networks).

Razorpay uses a native module and is **not available inside Expo Go**. To test
checkout, build and install a native Android/iOS development or preview app (for
Android, use `npx expo run:android` or the EAS preview build below), then start
Metro for that installed build. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
to the backend environment only; use Razorpay Test keys while testing.

The app finds the backend automatically: in development it reuses the IP of the machine
running Metro and assumes port 8000. To point at a deployed backend instead, create
`.env` with `EXPO_PUBLIC_API_BASE=https://your-backend.example.com`.

Android emulator: works as-is. iOS simulator: needs a Mac.

## Screens

| Route | Screen |
|---|---|
| `(tabs)/index` | Home: hero + 5 discovery rows |
| `(tabs)/explore` | Explore: category + sort pills |
| `(tabs)/nearby` | Nearby: grouped by locality |
| `(tabs)/review` | Review composer (hidden for business accounts) |
| `(tabs)/profile` | Reviewer profile, or the vendor dashboard for business accounts |
| `place/[id]` | Place: rating first, filterable review feed, "About" last |
| `write-review` | Composer with a place pre-selected |
| `search` | Search by name / locality / landmark |
| `login` | Required entry for signed-out users; choose User or Vendor, then log in or sign up with phone OTP (`?role=vendor` skips the choice) |
| `vendor/onboarding` | One-time shop listing |
| `vendor/dashboard/[id]` | Read-only dashboard (no reply/edit/hide, by design) |
| `reviewer/[id]` | Public reviewer profile |

## Stack

Expo Router, TanStack Query (server data), Zustand + expo-secure-store (session),
expo-location (GPS), expo-image-picker (camera/gallery), Feather/Ionicons icons,
Plus Jakarta Sans + Inter via `@expo-google-fonts`.
Styling is plain `StyleSheet` with the design tokens in `src/theme.ts`
(same palette as the web app).

## Differences from the web app

- A review is only sent with GPS if the user grants location permission. If they
  deny it, the review still posts, just without the Verified visit badge. (The web
  app fell back to the shop's own coordinates, which let anyone fake it.)
- Session lives in the OS secure store instead of localStorage.
- Signed-out users are redirected to the login/signup entry before opening app screens. First-time phone numbers are registered during OTP verification.
- Pull-to-refresh on every list screen.

## Known gaps

- **Photos are picked and uploaded, but the backend doesn't store them yet** (it saves
  a placeholder path), so photos don't show anywhere. Needs R2/S3 on the backend.
- **Vendor location check is weak:** onboarding uses one GPS reading as both the shop
  location and the "vendor location", so the distance check can't fail from the app.
- OTP is the dev stub (the code is shown on screen). Needs Firebase Phone Auth or MSG91.
- No real auth tokens yet: the app sends `user_id` itself. Add JWT on the backend first.
- Checkout creates a backend order and opens Razorpay. The backend verifies the
  payment signature and captures authorized payments before marking an order paid.
  Vendor notifications/refunds are not connected. Sample menu prices are estimates
  and are blocked from online checkout until the vendor confirms the menu.
- Release builds need an **HTTPS** backend (plain HTTP only works in development).
- App icon / splash images are the Expo placeholders in `assets/`.
- No animations beyond a press-scale and screen transitions yet.

## Build for the stores

```powershell
npm i -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # installable APK for testing
```
