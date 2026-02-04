# רשימת בדיקות לפני פריסה

## לפני הפריסה הראשונה

### אבטחה ✅
- [ ] אין credentials בקוד המקור
- [ ] `.env.local.example` לא מכיל ערכים אמיתיים
- [ ] Firestore rules מעודכנים ומגבילים גישה
- [ ] מסמך `config/allowedUsers` נוצר ב-Firestore

### Environment Variables ב-Vercel
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (אופציונלי)
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (אופציונלי)
- [ ] `SENTRY_DSN` (אופציונלי)

### Firebase
- [ ] פרויקט נוצר
- [ ] Authentication מופעל (Email/Password)
- [ ] Firestore Database נוצר
- [ ] Security Rules הועלו
- [ ] Web App נרשם
- [ ] Service Account נוצר

### Sentry (אופציונלי)
- [ ] פרויקט נוצר
- [ ] DSN הועתק

---

## בדיקות לאחר פריסה

### בדיקת תקינות בסיסית
- [ ] `/api/health` מחזיר `"status": "healthy"`
- [ ] דף ההתחברות נטען
- [ ] ניתן להתחבר עם משתמש מורשה
- [ ] הדשבורד נטען לאחר התחברות

### בדיקת פונקציונליות
- [ ] יצירת לקוח חדש עובדת
- [ ] יצירת מנה חדשה עובדת
- [ ] יצירת הזמנה חדשה עובדת
- [ ] שינוי סטטוס הזמנה עובד
- [ ] דף המטבח נטען עם נתונים

### בדיקת אבטחה
- [ ] Security Headers קיימים (בדיקה עם `curl -I`)
- [ ] `robots.txt` חוסם crawlers
- [ ] משתמש לא מורשה לא יכול להתחבר

### בדיקת Sentry (אם מותקן)
- [ ] יצירת שגיאה מכוונת (dev tools)
- [ ] השגיאה מופיעה ב-Sentry Dashboard

---

## פקודות בדיקה

```bash
# בדיקת Health endpoint
curl https://YOUR-DOMAIN.vercel.app/api/health

# בדיקת Security Headers
curl -I https://YOUR-DOMAIN.vercel.app

# בדיקת robots.txt
curl https://YOUR-DOMAIN.vercel.app/robots.txt
```

---

## לפני מסירה ללקוח

### תיעוד
- [ ] מדריך למשתמש הועבר ללקוח
- [ ] מדריך גיבויים הוסבר
- [ ] פרטי קשר לתמיכה נמסרו

### גישה
- [ ] משתמש ראשי נוצר ללקוח
- [ ] הלקוח מצליח להתחבר
- [ ] הלקוח מבין את הממשק הבסיסי

### הדרכה
- [ ] הדגמת יצירת הזמנה
- [ ] הדגמת ניהול לקוחות
- [ ] הדגמת שימוש במטבח ליום שישי
- [ ] הדגמת ייצוא נתונים לגיבוי

---

## הערות נוספות

_רשום כאן הערות ספציפיות לפרויקט:_

```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**תאריך פריסה:** ___________

**מבצע הפריסה:** ___________

**חתימה:** ___________
