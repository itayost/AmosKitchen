# מדריך פריסה - Amos Kitchen

מדריך זה מיועד לפריסת המערכת לסביבת ייצור.

## תוכן עניינים
1. [דרישות מקדימות](#דרישות-מקדימות)
2. [הגדרת Firebase](#הגדרת-firebase)
3. [הגדרת Sentry (אופציונלי)](#הגדרת-sentry-אופציונלי)
4. [פריסה ב-Vercel](#פריסה-ב-vercel)
5. [הגדרת משתמשים מורשים](#הגדרת-משתמשים-מורשים)
6. [בדיקת תקינות](#בדיקת-תקינות)
7. [תחזוקה שוטפת](#תחזוקה-שוטפת)

---

## דרישות מקדימות

### חשבונות נדרשים (חינם)
- [Vercel](https://vercel.com) - לאירוח האפליקציה
- [Firebase](https://firebase.google.com) - לבסיס נתונים ואימות
- [Sentry](https://sentry.io) - למעקב שגיאות (מומלץ, 5000 אירועים/חודש חינם)
- [GitHub](https://github.com) - לאחסון הקוד

### דרישות טכניות
- Node.js 18+ (להרצה מקומית בלבד)
- גישה לריפוזיטורי ב-GitHub

---

## הגדרת Firebase

### שלב 1: יצירת פרויקט Firebase

1. גש ל-[Firebase Console](https://console.firebase.google.com)
2. לחץ **"Create a project"** (או "Add project")
3. הזן שם לפרויקט (למשל: `amos-kitchen-prod`)
4. השבת/הפעל Google Analytics לפי בחירתך
5. לחץ **"Create project"**

### שלב 2: הפעלת Authentication

1. בתפריט הצד: **Build** → **Authentication**
2. לחץ **"Get started"**
3. בלשונית **Sign-in method**:
   - לחץ על **Email/Password**
   - הפעל את האפשרות
   - לחץ **"Save"**

### שלב 3: יצירת Firestore Database

1. בתפריט הצד: **Build** → **Firestore Database**
2. לחץ **"Create database"**
3. בחר מיקום:
   - `europe-west1` (בלגיה) - מומלץ לישראל
   - או `us-central1` למשתמשים בארה"ב
4. בחר **"Start in production mode"**
5. לחץ **"Create"**

### שלב 4: העלאת Firestore Rules

1. בתפריט הצד: **Firestore Database** → לשונית **Rules**
2. העתק את התוכן מקובץ `firestore.rules` בפרויקט
3. הדבק בעורך
4. לחץ **"Publish"**

### שלב 5: קבלת Firebase Client Config

1. לחץ על גלגל השיניים ⚙️ → **Project settings**
2. גלול ל-**Your apps**
3. אם אין אפליקציה:
   - לחץ על אייקון Web `</>`
   - הזן שם (למשל: `amos-kitchen-web`)
   - לחץ **"Register app"**
4. העתק את ערכי ה-`firebaseConfig`:
   ```
   apiKey: "..."
   authDomain: "..."
   projectId: "..."
   storageBucket: "..."
   messagingSenderId: "..."
   appId: "..."
   measurementId: "..." (אופציונלי)
   ```

### שלב 6: יצירת Service Account (Admin SDK)

1. **Project settings** → לשונית **Service accounts**
2. לחץ **"Generate new private key"**
3. שמור את קובץ ה-JSON שהורד
4. מהקובץ תצטרך:
   - `project_id`
   - `client_email`
   - `private_key`

---

## הגדרת Sentry (אופציונלי)

מעקב שגיאות מומלץ מאוד לזיהוי בעיות.

### יצירת פרויקט Sentry

1. גש ל-[Sentry](https://sentry.io) והירשם (חשבון חינם)
2. צור פרויקט חדש:
   - פלטפורמה: **Next.js**
   - שם: `amos-kitchen`
3. העתק את ה-DSN:
   ```
   https://xxx@xxx.ingest.sentry.io/xxx
   ```

---

## פריסה ב-Vercel

### שלב 1: חיבור הריפוזיטורי

1. גש ל-[Vercel](https://vercel.com) והתחבר
2. לחץ **"Add New..."** → **"Project"**
3. ייבא את הריפוזיטורי מ-GitHub
4. בחר את תיקיית `amos-kitchen` כ-Root Directory

### שלב 2: הגדרת Environment Variables

ב-Settings → Environment Variables, הוסף:

#### Firebase Client (NEXT_PUBLIC_*)
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | מה-Firebase Config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | מה-Firebase Config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | מה-Firebase Config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | מה-Firebase Config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | מה-Firebase Config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | מה-Firebase Config (אופציונלי) |

#### Firebase Admin (Server-side)
| Variable | Value |
|----------|-------|
| `FIREBASE_ADMIN_PROJECT_ID` | מה-Service Account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | מה-Service Account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | מה-Service Account JSON (כולל \n) |

> ⚠️ **חשוב**: ב-`FIREBASE_ADMIN_PRIVATE_KEY` יש לכלול את המפתח המלא כולל `-----BEGIN PRIVATE KEY-----` ו-`-----END PRIVATE KEY-----`

#### Sentry (אופציונלי)
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | ה-DSN מ-Sentry |
| `SENTRY_DSN` | אותו DSN |

### שלב 3: פריסה

1. לחץ **"Deploy"**
2. המתן לסיום הבנייה (2-3 דקות)
3. בסיום תקבל כתובת URL

### שלב 4: הגדרת דומיין (אופציונלי)

1. ב-Project Settings → Domains
2. הוסף את הדומיין שלך
3. עקוב אחר הוראות ה-DNS

---

## הגדרת משתמשים מורשים

### יצירת מסמך AllowedUsers

המערכת משתמשת ברשימת משתמשים מורשים ב-Firestore:

1. גש ל-Firebase Console → Firestore Database
2. לחץ **"Start collection"**
3. Collection ID: `config`
4. Document ID: `allowedUsers`
5. הוסף שדה:
   - שם: `emails`
   - סוג: `array`
   - ערכים: רשימת כתובות האימייל המורשות

   ```
   emails: [
     "user1@example.com",
     "user2@example.com"
   ]
   ```

6. לחץ **"Save"**

### יצירת משתמש ראשון

1. Firebase Console → Authentication → Users
2. לחץ **"Add user"**
3. הזן אימייל וסיסמה
4. ודא שהאימייל נמצא ברשימת `allowedUsers`

---

## בדיקת תקינות

### בדיקת Health Endpoint

```bash
curl https://your-domain.vercel.app/api/health
```

תוצאה צפויה:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "checks": {
    "firebase": "ok",
    "environment": "ok"
  }
}
```

### בדיקת התחברות

1. גש לכתובת האפליקציה
2. התחבר עם משתמש מורשה
3. ודא שניתן לראות את הדשבורד

### בדיקת יצירת הזמנה

1. לחץ "הזמנה חדשה"
2. בחר/צור לקוח
3. הוסף מנה
4. שמור את ההזמנה
5. ודא שההזמנה נשמרה

### בדיקת Security Headers

```bash
curl -I https://your-domain.vercel.app
```

ודא שקיימים:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## תחזוקה שוטפת

### עדכון האפליקציה

1. דחוף שינויים ל-GitHub (branch: main)
2. Vercel יפרוס אוטומטית
3. בדוק את הלוג ב-Vercel Dashboard

### הוספת משתמש חדש

1. Firebase Console → Authentication → Add user
2. הוסף את האימייל ל-`config/allowedUsers` ב-Firestore

### מעקב שגיאות (Sentry)

1. גש ל-[Sentry Dashboard](https://sentry.io)
2. בדוק Issues חדשים באופן שבועי
3. טפל בשגיאות קריטיות

### גיבויים

ראה מסמך [BACKUP.md](./BACKUP.md)

---

## רשימת בדיקות לפריסה

- [ ] Firebase project נוצר
- [ ] Authentication מופעל (Email/Password)
- [ ] Firestore Database נוצר
- [ ] Firestore Rules הועלו
- [ ] Web App נרשם ב-Firebase
- [ ] Service Account נוצר
- [ ] Sentry project נוצר (אופציונלי)
- [ ] Vercel project נוצר
- [ ] כל Environment Variables הוגדרו
- [ ] פריסה הצליחה
- [ ] `allowedUsers` document נוצר
- [ ] משתמש ראשון נוצר
- [ ] Health endpoint מחזיר healthy
- [ ] התחברות עובדת
- [ ] יצירת הזמנה עובדת

---

## פתרון בעיות נפוצות

### "Missing Firebase config" בעת build
- ודא שכל משתני הסביבה מוגדרים ב-Vercel
- בדוק שאין טעויות הקלדה בשמות המשתנים

### "Permission denied" ב-Firestore
- ודא שהאימייל נמצא ב-`allowedUsers`
- ודא ש-Firestore Rules הועלו נכון

### "Invalid private key"
- ודא שה-private key כולל את כל הטקסט כולל headers
- בדוק שה-`\n` לא הוחלפו

### Build נכשל ב-Vercel
1. בדוק את הלוגים ב-Vercel Dashboard
2. נסה לבנות מקומית: `npm run build`

---

*מסמך זה עודכן לאחרונה: ינואר 2026*
