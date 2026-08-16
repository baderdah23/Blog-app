# توثيق الـ API (Article Extractor Backend)

سيرفر بسيط لاستخراج بيانات ومحتوى المقالات من أي رابط وإرجاعها بشكل منظم (JSON).

---

## 🚀 تشغيل السيرفر

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل السيرفر في وضع التطوير
npm run dev
```
السيرفر يعمل افتراضياً على: `http://localhost:3000`

---

## 📌 الروابط المتاحة (Endpoints)

### 1️⃣ فحص حالة السيرفر
* **الرابط:** `GET /api/health`
* **النتيجة:**
```json
{
  "ok": true
}
```

---

### 2️⃣ استخراج بيانات المقال
* **الرابط:** `GET /api/article?url=YOUR_URL`
* **المعاملات (Query Params):** 
  * `url` *(مطلوب)*: رابط المقال المراد استخراجه.

#### 🟢 شكل الرد الناجح (200 OK):
```json
{
  "success": true,
  "article": {
    "title": "عنوان المقال",
    "author": "اسم الكاتب (أو null)",
    "authorImage": "رابط صورة الكاتب (أو null)",
    "date": "تاريخ النشر (أو null)",
    "category": "قسم المقال (أو null)",
    "sourceName": "اسم المصدر (أو null)",
    "sourceUrl": "https://example.com/article-path",
    "featuredImage": "رابط الصورة الرئيسية (أو null)",
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "alt": "وصف الصورة"
      }
    ],
    "content": [
      {
        "title": "نظرة عامة",
        "image": "رابط الصورة داخل الفقرة (إن وجدت) أو null",
        "text": "نص الفقرة الأولى من المقال..."
      },
      {
        "title": "الخلاصة",
        "image": null,
        "text": "نص الفقرة الثانية من المقال..."
      }
    ]
  }
}
```

#### 🔴 شكل الرد في حال الخطأ:
* **400 Bad Request** (عند عدم تمرير رابط أو تمرير رابط غير صالح):
```json
{
  "error": "Missing article URL."
}
```
* **500 Internal Server Error** (عند حدوث مشكلة أثناء استخراج المحتوى):
```json
{
  "error": "Failed to extract article.",
  "details": "تفاصيل الخطأ"
}
```

---

## 💻 طريقة الاستخدام (الكود)

### 1️⃣ باستخدام JavaScript / React (Fetch):
```javascript
const articleUrl = "https://example.com/news/123";

try {
  const response = await fetch(
    `http://localhost:3000/api/article?url=${encodeURIComponent(articleUrl)}`
  );
  const data = await response.json();

  if (data.success) {
    console.log("عنوان المقال:", data.article.title);
    console.log("محتوى المقال:", data.article.content);
  } else {
    console.error("خطأ:", data.error);
  }
} catch (err) {
  console.error("فشل الاتصال بالسيرفر:", err);
}
```

### 2️⃣ باستخدام cURL (المبسط):
```bash
curl "http://localhost:3000/api/article?url=https://example.com/news/123"
```

