# VerzZify — Flutter

One project: **Web → then iOS and Android**. Do not start a second native app.

This sandbox still runs the TanStack catalog on port 8080 (Grok preview). The store client is this Flutter app.

## 1. Web MVP (now)

```bash
cd apps/flutter
flutter pub get
flutter run -d chrome --dart-define=HOST=http://127.0.0.1:8080
```

`HOST` is the catalog that serves `/audio` and `/covers` (the Node app, or later Render).

```bash
flutter build web --release --dart-define=HOST=https://verzzify.com
```

Host `build/web` on Render/Firebase. Same custom domain.

## 2. Test with artists and listeners

Use the Web build. Playback, geo feed, follow, promote.

## 3. Native playback, downloads, FCM, billing

`just_audio` is already the player. Add `firebase_messaging`, store billing, Indexed downloads. **No YouTube offline.**

## 4. Same project → phones

```bash
flutter create --platforms=ios,android .
flutter run -d ios
flutter run -d android
```

Xcode + Apple Developer for iOS. Android Studio + Play Console for Android.

## 5. Store submit

`flutter build ipa` / `flutter build appbundle` — after step 3 is actually done.

Secrets (S3, YouTube server key, payments) stay on the API. The Flutter app only talks HTTPS.
