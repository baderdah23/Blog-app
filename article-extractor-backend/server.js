import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((x) => x.trim())
      : true,
  }),
);
app.use(express.json({ limit: "1mb" }));

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    author: { type: ["string", "null"] },
    authorImage: { type: ["string", "null"] },
    date: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    sourceName: { type: ["string", "null"] },
    sourceUrl: { type: ["string", "null"] },
    featuredImage: { type: ["string", "null"] },
    images: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          alt: { type: ["string", "null"] },
        },
      },
    },
    content: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          text: { type: ["string", "null"] },
          url: { type: ["string", "null"] },
          alt: { type: ["string", "null"] },
        },
      },
    },
  },
  required: [
    "title",
    "author",
    "authorImage",
    "date",
    "category",
    "sourceName",
    "sourceUrl",
    "featuredImage",
    "images",
    "content",
  ],
};

const navCategoriesRegex =
  /(?:الرئيسية|عاجل|سياسة|تقارير|حوادث|عرب|عالم|تحقيقات|اقتصاد|رياضة|كرة عالمية|المزيد|محافظات|تليفزيون|دين وحياة|أسعار وأسواق|كاريكاتير|فن|حظك اليوم|ثقافة|منوعات|مرأة|صحة|ألبومات|مقالات|تكنولوجيا|فيديو|لايف ستايل|وسائط|الأسبوعي|صحافة|بلدنا|أخبار|تغطية خاصة)/gi;

const arabicDateRegex =
  /(?:السبت|الأحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)،?\s+\d{1,2}\s+(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|\d{1,2})\s*\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(?:ص|م)?)?/gi;

function cleanText(value) {
  return String(value || "")
    .replace(/^Title:\s*.+$/gm, "")
    .replace(/^Published Time:\s*.+$/gm, "")
    .replace(/^URL Source:\s*.+$/gm, "")
    .replace(/^Markdown Content:\s*$/gm, "")
    .replace(/^Warning:\s*.+$/gm, "")
    .replace(arabicDateRegex, "")
    .replace(/##\s*https?:\/\/[^\s]+/gi, "")
    .replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g, "")
    .replace(/\[[^\]]*\]\((javascript:|#)[^)]*\)/gi, "")
    .replace(/\[\s*\]\s*\(?/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/(?:اقرأ|إقرأ|شاهد|مواضيع)\s+أيضاً\s*:?/gi, "")
    .replace(/مواضيع\s+ذات\s+صلة\s*:?/gi, "")
    .replace(/قبل\s+\d+\s+(?:ساعة|ساعات|دقيقة|دقائق)/gi, "")
    .replace(/المدة\s+\d+[\d,:]*/gi, "")
    .replace(/اترك\s+تعليقاً|إلغاء\s+الرد/gi, "")
    .replace(/لن\s+يتم\s+نشر\s+عنوان\s+بريدك\s+الإلكتروني\.?/gi, "")
    .replace(/الحقول\s+الإلزامية\s+مشار\s+إليها\s+بـ\s*\*?/gi, "")
    .replace(
      /\[x\]\s*أعلمني\s+(?:بمتابعة\s+التعليقات|بالمواضيع\s+الجديدة).*/gi,
      "",
    )
    .replace(
      /يقول\s+.+?:\s*(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|\d+).+?الساعة\s+\d+:\d+.*$/gm,
      "",
    )
    .replace(/حولنا\s*\/\s*About us/gi, "")
    .replace(/أعلن معنا\s*\/\s*Advertise with us/gi, "")
    .replace(/أرشيف النسخة المطبوعة/gi, "")
    .replace(/النسخة المطبوعة/gi, "")
    .replace(/أرشيف PDF(?:\s*النسخة المطبوعة)?/gi, "")
    .replace(/جميع الحقوق محفوظة(?:\s*©?\s*\d{4}?)?/gi, "")
    .replace(/شارك على\s*/g, "")
    .replace(/نسخ الرابط تم النسخ!/g, "")
    .replace(
      /(?:(?:##|#|\||•|\/|\s+)*(?:الرئيسية|عاجل|سياسة|تقارير|حوادث|عرب|عالم|تحقيقات|اقتصاد|رياضة|كرة عالمية|المزيد|محافظات|تليفزيون|دين وحياة|أسعار وأسواق|كاريكاتير|فن|حظك اليوم|ثقافة|مرأة|منوعات|صحة|ألبومات|مقالات|تكنولوجيا|فيديو 7|فيديو|لايف ستايل|وسائط|الأسبوعي|صحافة|بلدنا)(?:\s+[^\s#|]+)?){2,}/gi,
      "",
    )
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`+/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/#{2,}\s*/g, "")
    .replace(/\s+/g, " ")
    .replace(/\uFFFD/g, "")
    .trim();
}

function getMeaningfulTitle(text, index) {
  const clean = cleanText(text).replace(/^(ال|و|ثم|بعد ذلك)\s+/g, "");
  if (!clean) return index === 0 ? "نظرة عامة" : "الخلاصة";

  if (
    clean.includes("أخبار") ||
    clean.includes("تحديث") ||
    clean.includes("حدث")
  ) {
    return index === 0 ? "نظرة عامة" : "الخلاصة";
  }

  return index === 0 ? "نظرة عامة" : "الخلاصة";
}

function normalizeBlock(item, index) {
  const text =
    typeof item?.text === "string"
      ? cleanText(item.text)
      : typeof item?.content === "string"
        ? cleanText(item.content)
        : "";

  const image =
    typeof item?.image === "string" && item.image
      ? item.image
      : typeof item?.url === "string" && item.url
        ? item.url
        : null;

  const title =
    typeof item?.title === "string" &&
    item.title.trim() &&
    !/^Paragraph\s+\d+$/i.test(item.title.trim())
      ? cleanText(item.title.trim())
      : getMeaningfulTitle(text, index);

  return {
    title,
    image,
    text,
  };
}

function buildParagraphBlocks(markdownText) {
  const cleaned = String(markdownText || "")
    .replace(/\r/g, "")
    .replace(/\[\^\w+\]/g, "")
    .trim();

  if (!cleaned) return [];

  const lines = cleaned.split(/\n/);
  const blocks = [];
  let currentTitle = "نظرة عامة";
  let currentImage = null;
  let buffer = [];

  const flush = () => {
    const text = buffer.join(" ");
    const safeText = cleanText(text);
    if (!safeText || safeText.length < 25) {
      buffer = [];
      currentImage = null;
      return;
    }

    const testBlock = {
      title: currentTitle,
      image: currentImage,
      text: safeText,
    };

    if (!isBoilerplateBlock(testBlock)) {
      blocks.push(testBlock);
    }

    buffer = [];
    currentImage = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip nav menu chains or date headers
    if (
      /(?:##|#|\s)*(?:الرئيسية|عاجل|سياسة|تقارير|حوادث|عرب|عالم|تحقيقات|اقتصاد|رياضة|تليفزيون|فن|صحة|مرأة|تكنولوجيا|محافظات|حظك اليوم)/i.test(
        line,
      ) &&
      (line.match(/##|#/g) || []).length >= 2
    ) {
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      if (buffer.length) flush();
      const headingTitle = cleanText(headingMatch[1]);
      if (
        headingTitle &&
        !isBoilerplateBlock({ title: headingTitle, text: "" })
      ) {
        currentTitle = headingTitle;
      }
      continue;
    }

    const imageMatch = line.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/i);
    if (imageMatch) {
      currentImage = currentImage || imageMatch[1];
    }

    if (!line) {
      if (buffer.length) flush();
      continue;
    }

    if (
      /^\s*(Title:|URL Source:|Published Time:|Markdown Content:|\|.*\|)\s*$/i.test(
        line,
      )
    )
      continue;
    if (
      /^\s*(References|Further reading|See also|External links|Navigation|More from BBC|Site search)\b/i.test(
        line,
      )
    )
      continue;
    if (line.startsWith("|")) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (/<\/?[a-z][\s\S]*>/i.test(line)) continue;

    const cleanedLine = cleanText(line).replace(/^([-*]|\d+\.)\s+/, "");
    if (!cleanedLine) continue;

    buffer.push(cleanedLine);
  }

  if (buffer.length) flush();

  if (blocks.length === 0) {
    const fallback = cleanText(cleaned)
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.length > 40);

    return fallback
      .map((sentence, index) => ({
        title: index === 0 ? "نظرة عامة" : "الخلاصة",
        image: null,
        text: sentence,
      }))
      .filter((block) => !isBoilerplateBlock(block));
  }

  return blocks.map((block, index) => ({
    title:
      block.title && !/^Paragraph\s+\d+$/i.test(block.title)
        ? block.title
        : getMeaningfulTitle(block.text, index),
    image: block.image || null,
    text: block.text,
  }));
}

function isBoilerplateBlock(block) {
  const text = block?.text || "";
  const title = block?.title || "";
  const combined = `${title} ${text}`;

  if (
    /جميع الحقوق محفوظة|حقوق النشر|كل الحقوق محفوظة|Copyright/i.test(combined)
  )
    return true;
  if (
    /(حولنا|About us|أعلن معنا|Advertise with us|أرشيف النسخة المطبوعة|النسخة المطبوعة|أرشيف PDF|شروط الاستخدام|سياسة الخصوصية|اتصل بنا|عن الموقع)/i.test(
      combined,
    ) &&
    combined.length < 400
  )
    return true;
  if (
    /^(تويتر|فيسبوك|يوتيوب|انستغرام|واتساب|ثريدز|نبض|تيك توك|فيسبوك \||\s|@)+$/i.test(
      text.trim(),
    )
  )
    return true;
  if (
    /(تابعنا على|تواصل معنا|صفحتنا على|وسائل التواصل الاجتماعي)/i.test(
      combined,
    ) &&
    combined.length < 300
  )
    return true;
  if (
    /^(الأكثر قراءة|الأكثر مشاهدة|الأكثر تفاعلاً|الأكثر تعليقاً|الأكثر تعليقا|تفضيلات القراء|اقرأ أيضاً|إقرأ أيضاً|مواضيع ذات صلة|أخبار ذات صلة|اخترنا لك|اخترنا لكم|النشرة الإخبارية|روابط ذات صلة|روابط لبي بي سي|تابعنا على)$/i.test(
      title.trim(),
    )
  )
    return true;
  if (
    /اترك تعليقاً|إلغاء الرد|لن يتم نشر عنوان بريدك|الحقول الإلزامية مشار إليها|أعلمني بمتابعة التعليقات|أعلمني بالمواضيع الجديدة|يقول\s+.+?:\s*(?:أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|\d+)/i.test(
      combined,
    )
  )
    return true;
  if (
    /الأكثر قراءة|الأكثر تعليقاً|الأكثر تعليقا|الأكثر مشاهدة/i.test(title) ||
    /الأكثر قراءة\s+الأكثر تعليقا/i.test(combined)
  )
    return true;

  if (
    /(?:##|###).*?(?:##|###)/s.test(text) ||
    (text.match(/###/g) || []).length >= 2
  )
    return true;

  const categoryMatches = text.match(
    /(?:الرئيسية|عاجل|سياسة|تقارير|حوادث|عرب|عالم|تحقيقات|اقتصاد|رياضة|كرة عالمية|المزيد|محافظات|تليفزيون|دين وحياة|أسعار وأسواق|كاريكاتير|فن|حظك اليوم|ثقافة|منوعات|صحة|ألبومات|مقالات|تكنولوجيا|فيديو)/gi,
  );
  if (categoryMatches && categoryMatches.length >= 2) return true;

  if (/(?:\d+\s*##|\d+\s*#).*?\d+\s*##/s.test(text)) return true;

  return false;
}

function mergeContentBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  const validBlocks = blocks
    .filter(
      (block) =>
        block &&
        typeof block.text === "string" &&
        block.text.trim().length > 8 &&
        !isBoilerplateBlock(block),
    )
    .map((block, index) => ({
      title:
        typeof block.title === "string" && block.title.trim()
          ? cleanText(block.title.trim())
          : getMeaningfulTitle(block.text, index),
      image: block.image || null,
      text: cleanText(block.text),
    }));

  if (validBlocks.length === 0) return [];

  const grouped = new Map();
  const orderedTitles = [];

  for (const block of validBlocks) {
    const key = (block.title || "نظرة عامة")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!grouped.has(key)) {
      grouped.set(key, {
        title: block.title || "نظرة عامة",
        image: block.image || null,
        texts: [],
      });
      orderedTitles.push(key);
    }

    grouped.get(key).texts.push(block.text);
  }

  return orderedTitles.map((key) => {
    const group = grouped.get(key);
    return {
      title: group.title || "نظرة عامة",
      image: group.image || null,
      text: group.texts.filter(Boolean).join(" "),
    };
  });
}

function toContentBlocks(content) {
  if (Array.isArray(content)) {
    return mergeContentBlocks(
      content
        .filter(
          (block) =>
            block &&
            (block.text ||
              block.url ||
              block.alt ||
              block.title ||
              block.image ||
              block.content),
        )
        .map((block, index) => normalizeBlock(block, index))
        .filter((block) => block.text && block.text.length > 8),
    );
  }

  if (typeof content === "string") {
    return mergeContentBlocks(buildParagraphBlocks(content));
  }

  return [];
}

function normalize(raw, fallbackUrl) {
  const d = raw?.data ?? raw?.result ?? raw;
  if (!d || typeof d !== "object") {
    throw new Error("Invalid extractor response.");
  }

  const images = Array.isArray(d.images)
    ? d.images
        .filter((x) => x?.url)
        .map((x) => ({
          url: x.url,
          alt: x.alt || x.title || null,
        }))
    : [];

  const validImages = images.filter(
    (img) =>
      img.url &&
      !img.url.endsWith(".svg") &&
      !img.url.includes("logo") &&
      !img.url.includes("icon"),
  );

  let contentBlocks = toContentBlocks(d.content);
  let imgIndex = 0;

  contentBlocks = contentBlocks.map((block) => {
    if (!block.image && imgIndex < validImages.length) {
      block.image = validImages[imgIndex].url;
      imgIndex++;
    }
    return block;
  });

  return {
    title: d.title || "",
    author: d.author || null,
    authorImage: d.authorImage || null,
    date: d.date || null,
    category: d.category || null,
    sourceName: d.sourceName || null,
    sourceUrl: d.sourceUrl || fallbackUrl,
    featuredImage: d.featuredImage || images[0]?.url || null,
    images,
    content: contentBlocks,
  };
}

function parseMarkdownFallback(markdown, fallbackUrl) {
  const cleaned = String(markdown || "")
    .replace(/\r/g, "")
    .replace(/\[\^\w+\]/g, "")
    .trim();

  if (!cleaned) {
    return {
      title: "",
      author: null,
      authorImage: null,
      date: null,
      category: null,
      sourceName: null,
      sourceUrl: fallbackUrl,
      featuredImage: null,
      images: [],
      content: [],
    };
  }

  const titleMatch =
    cleaned.match(/^Title:\s*(.+)$/m) ||
    cleaned.match(/^#\s+(.+)$/m) ||
    cleaned.match(/^title:\s*(.+)$/im);
  const title = titleMatch ? titleMatch[1].trim() : "Article";

  const imageMatches = [
    ...cleaned.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi),
  ];
  const images = imageMatches.map((match) => ({
    url: match[1],
    alt: title,
  }));

  const markdownSections = mergeContentBlocks(buildParagraphBlocks(cleaned));
  const paragraphs = markdownSections.map((section) => ({
    title: section.title,
    image: section.image || null,
    text: section.text,
  }));

  return {
    title,
    author: null,
    authorImage: null,
    date: null,
    category: null,
    sourceName: null,
    sourceUrl: fallbackUrl,
    featuredImage: images[0]?.url || markdownSections[0]?.image || null,
    images,
    content: paragraphs,
  };
}

async function fetchArticleFromJina(target) {
  const url = `https://r.jina.ai/http://${target.host}${target.pathname}${target.search}`;

  const response = await fetch(url, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "Mozilla/5.0",
    },
    signal: AbortSignal.timeout(20000),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Jina request failed with status ${response.status}: ${text.slice(0, 500)}`,
    );
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Jina returned an empty response.");
  }

  try {
    const parsed = JSON.parse(trimmed);
    const article = normalize(parsed, target.href);
    if (Array.isArray(article.content) && article.content.length > 0) {
      return article;
    }
  } catch {
    // not JSON, fallback to markdown parsing below
  }

  const articleFromMarkdown = parseMarkdownFallback(trimmed, target.href);
  if (articleFromMarkdown.content.length > 0) {
    return {
      ...articleFromMarkdown,
      content: mergeContentBlocks(toContentBlocks(articleFromMarkdown.content)),
    };
  }

  const fallbackBlocks = mergeContentBlocks(buildParagraphBlocks(trimmed));
  return normalize(
    {
      title: titleFromTarget(target),
      content: fallbackBlocks,
      featuredImage: fallbackBlocks[0]?.image || null,
    },
    target.href,
  );
}

function titleFromTarget(target) {
  const lastSegment = target.pathname.split("/").filter(Boolean).at(-1);
  return lastSegment
    ? decodeURIComponent(lastSegment.replace(/[-_]/g, " "))
    : "Article";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GNews caching / dedupe / quota-cooldown layer.
//
// GNews' free tier only allows 100 requests/day and 1 request/second. The
// previous implementation forwarded every single /api/news call straight to
// GNews and simply mirrored back whatever status GNews returned - so any
// repeated call from the client (page reloads, React StrictMode invoking
// effects twice in dev, revisiting the same page, etc.) burned through the
// daily quota and then got stuck returning 429 for the rest of the day.
//
// This layer makes sure:
//   1. Identical requests within NEWS_CACHE_TTL_MS are served from memory
//      instead of calling GNews again.
//   2. Concurrent requests for the same page are collapsed into a single
//      upstream call ("single-flight").
//   3. Once GNews returns 429, we stop calling it entirely until the quota
//      resets (00:00 UTC) and instead serve the last cached data we have
//      (even if slightly stale) rather than hammering GNews further.
// ---------------------------------------------------------------------------

const NEWS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const newsCache = new Map(); // page -> { payload, fetchedAt }
const inFlightNewsRequests = new Map(); // page -> Promise<payload>
let quotaExceededUntil = 0; // epoch ms; skip calling GNews while now < this

function msUntilNextUtcMidnight() {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.getTime() - now.getTime();
}

async function fetchNewsFromGNews(page) {
  const params = new URLSearchParams({
    category: "technology",
    max: "6",
    page: String(page),
    lang: "ar",
    apikey: GNEWS_API_KEY,
  });

  const response = await fetch(
    `https://gnews.io/api/v4/top-headlines?${params.toString()}`,
    { signal: AbortSignal.timeout(15000) },
  );

  const payload = await response.json();

  if (response.status === 429) {
    // Daily/per-second quota hit. Stop calling GNews until it resets instead
    // of continuing to hammer it on every future request.
    quotaExceededUntil = Date.now() + msUntilNextUtcMidnight();
    const err = new Error("GNews quota exceeded.");
    err.status = 429;
    err.payload = payload;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(
      `GNews request failed with status ${response.status}`,
    );
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

async function getNewsPage(page) {
  const cached = newsCache.get(page);
  const isFresh = cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL_MS;

  if (isFresh) {
    return { payload: cached.payload, fromCache: true, stale: false };
  }

  // Quota is known to be exhausted for today: never call GNews again until
  // it resets. Serve whatever cache we have, even if it's stale.
  if (Date.now() < quotaExceededUntil) {
    if (cached) {
      return { payload: cached.payload, fromCache: true, stale: true };
    }
    const err = new Error(
      "GNews daily quota exceeded and no cached data is available.",
    );
    err.status = 429;
    throw err;
  }

  // Single-flight: reuse an in-progress request for the same page instead of
  // firing a second call to GNews.
  if (inFlightNewsRequests.has(page)) {
    const payload = await inFlightNewsRequests.get(page);
    return { payload, fromCache: false, stale: false };
  }

  const requestPromise = fetchNewsFromGNews(page)
    .then((payload) => {
      newsCache.set(page, { payload, fetchedAt: Date.now() });
      return payload;
    })
    .finally(() => {
      inFlightNewsRequests.delete(page);
    });

  inFlightNewsRequests.set(page, requestPromise);

  try {
    const payload = await requestPromise;
    return { payload, fromCache: false, stale: false };
  } catch (error) {
    // GNews failed (quota, network, etc.) - fall back to stale cache rather
    // than breaking the UI if we have something to show.
    if (cached) {
      return { payload: cached.payload, fromCache: true, stale: true };
    }
    throw error;
  }
}

app.get("/api/news", async (req, res) => {
  const pageValue = Number.parseInt(String(req.query.page ?? "1"), 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;

  if (!GNEWS_API_KEY) {
    return res.status(500).json({ error: "Missing GNEWS_API_KEY on server." });
  }

  try {
    const { payload, fromCache, stale } = await getNewsPage(page);
    res.set("X-Cache", fromCache ? (stale ? "STALE" : "HIT") : "MISS");
    return res.json(payload);
  } catch (error) {
    const status = error?.status || 500;

    if (status === 429) {
      res.set(
        "Retry-After",
        String(Math.ceil(msUntilNextUtcMidnight() / 1000)),
      );
      return res.status(429).json({
        error: "GNews daily quota reached. Please try again after 00:00 UTC.",
        details: error.payload || error.message,
      });
    }

    return res.status(status).json({
      error: "Failed to fetch top headlines.",
      details: error?.payload || error?.message || "Unknown error",
    });
  }
});

app.get("/api/article", async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string")
    return res.status(400).json({ error: "Missing article URL." });

  let target;
  try {
    target = new URL(url);
    if (!["http:", "https:"].includes(target.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: "Invalid article URL." });
  }

  try {
    const article = await fetchArticleFromJina(target);
    return res.json({ success: true, article });
  } catch (error) {
    console.error("Article extraction failed:", error);
    return res.status(500).json({
      error: "Failed to extract article.",
      details: error?.message || "Unknown error",
    });
  }
});

app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

const __filename = fileURLToPath(import.meta.url);

export {
  app,
  buildParagraphBlocks,
  parseMarkdownFallback,
  normalize,
  toContentBlocks,
  cleanText,
  isBoilerplateBlock,
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = app.listen(PORT, () => {
    console.log(`Article extractor API: http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    console.error("Server startup failed:", error);

    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Close the other process or change PORT.`,
      );
    }

    process.exit(1);
  });

  process.on("SIGINT", () => {
    server.close(() => {
      console.log("Server stopped gracefully.");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      console.log("Server stopped gracefully.");
      process.exit(0);
    });
  });
}
