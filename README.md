# FNH Field Check

An installable, mobile-friendly field check-out app for students and teachers.

## Features

- Student name selection
- Going out, 30-minute safety check, heading back, and safely-in updates
- GPS coordinates captured with every student update
- Offline queue for updates when a phone temporarily loses service
- Shared Google Sheet activity log
- Teacher dashboard that refreshes every five seconds
- Silent background refresh that keeps the current activity visible
- Confirmed end-of-day reset that clears activity while preserving Sheet headers
- Private teacher sync key kept out of student setup links
- Editable private sync key so multiple teacher devices can use the same live dashboard
- Add-to-Home-Screen support for iPhone
- Launch-time location and notification readiness prompt

## Files

- `index.html` — complete application, styling, and behavior
- `manifest.webmanifest` — Home Screen app information
- `icon.svg` — application icon
- `sw.js` — offline and Home Screen support
- `google-apps-script/Code.gs` — Google Sheet backend source
- `google-apps-script/appsscript.json` — Apps Script project settings

There is no build step and no package installation.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. GitHub will display the public Pages URL after deployment finishes.

The app must be served over HTTPS for phone location and notifications to work. GitHub Pages provides HTTPS.

## Connect the shared Google Sheet

1. Create a Google Sheet and rename its first tab exactly `Field Log`.
2. Open the published FNH Field Check app and tap the gear.
3. In the Google Sheet, open **Extensions → Apps Script**.
4. Copy `google-apps-script/Code.gs` into the Apps Script editor.
5. Replace `REPLACE_WITH_THE_PRIVATE_TEACHER_SYNC_KEY` with the private key displayed in the app's teacher setup. Do not commit the real key to GitHub.
6. Save the Apps Script project. Alternatively, the app's **Copy code** button produces the same script with the private key already inserted.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
9. Deploy, authorize the script, and copy the Web App URL ending in `/exec`.
10. Paste that URL into the app's teacher setup and select **Save connection**.
11. Select **Send test** and confirm that a row appears in the Sheet.
12. Select **Copy student setup link** and give that link to students. Students open it once; they do not edit or install Apps Script.

## Teacher view

Open **Teacher view** at the bottom of the app. The current demonstration password is `teacher`. The dashboard checks the shared Sheet every five seconds and can show on-screen alerts while open.

For another teacher phone or computer, open the gear on that device and paste both the same Google Apps Script Web App URL and the same private teacher sync key, then select **Save connection**. The main teacher can use **Copy private key** to share it securely. Never send the private key to students.

## Privacy and production use

This app records student names and precise locations. The `teacher` screen password is intended only for a controlled prototype. Before publicly deploying the app, replace it with real authentication and follow your school's privacy and data-retention policies. Keep the Google Apps Script URL and teacher sync key private.
