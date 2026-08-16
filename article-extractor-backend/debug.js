import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 3000);


  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((x) => x.trim())
      : true,
  }),
);


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

function cleanText(value) {
  return String(value || "")
    .replace(/^Title:\s*.+$/gm, "")
    .replace(/^Published Time:\s*.+$/gm, "")
    .replace(/^URL Source:\s*.+$/gm, "")
    .replace(/^Markdown Content:\s*$/gm, "")
    .replace(/^Warning:\s*.+$/gm, "")
    .replace(/##\s*https?:\/\/[^\s]+/gi, "")
    .replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g, "")
    .replace(/\[[^\]]*\]\((javascript:|#)[^)]*\)/gi, "")
    .replace(/شارك على\s*/g, "")
    .replace(/نسخ الرابط تم النسخ!/g, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`+/g, "")
    .replace(/\[\d+\]/g, "")
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

    blocks.push({
      title: currentTitle,
      image: currentImage,
      text: safeText,
    });

    buffer = [];
    currentImage = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      if (buffer.length) flush();
      const headingTitle = cleanText(headingMatch[1]);
      if (headingTitle) currentTitle = headingTitle;
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

    return fallback.map((sentence, index) => ({
      title: index === 0 ? "نظرة عامة" : "الخلاصة",
      image: null,
      text: sentence,
    }));
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

function mergeContentBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  const validBlocks = blocks
    .filter(
      (block) =>
        block && typeof block.text === "string" && block.text.trim().length > 8,
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


  res.json({ ok: true });
});


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



const __filename = fileURLToPath(import.meta.url);

export {
  app,
  buildParagraphBlocks,
  parseMarkdownFallback,
  normalize,
  toContentBlocks,
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = 
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

const raw = require('./test_annahar.json').article; console.log(normalize({data: raw}).content[0]);