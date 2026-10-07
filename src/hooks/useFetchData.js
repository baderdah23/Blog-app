import { useEffect, useState } from "react";

const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;
const GNEWS_URL = "https://gnews.io/api/v4/top-headlines";

const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
const newsCache = new Map();
const inFlightNewsRequests = new Map();
let quotaExceededUntil = 0;

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

async function fetchNewsFromGNews(page, max) {
  const params = new URLSearchParams({
    category: "technology",
    max: String(max),
    page: String(page),
    lang: "ar",
    apikey: GNEWS_API_KEY,
  });

  const response = await fetch(`${GNEWS_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });

  const payload = await response.json();

  if (response.status === 429) {
    quotaExceededUntil = Date.now() + msUntilNextUtcMidnight();
    const err = new Error("تم تجاوز الحد اليومي للأخبار. حاول بعد 00:00 UTC.");
    err.status = 429;
    err.payload = payload;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(
      payload?.errors?.[0] || "Failed to load news.",
    );
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  if (payload?.errors?.length) {
    const err = new Error(payload.errors[0]);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

async function getNewsPage(page, max) {
  const cacheKey = `${page}:${max}`;
  const cached = newsCache.get(cacheKey);
  const isFresh = cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL_MS;

  if (isFresh) {
    return cached.payload;
  }

  if (Date.now() < quotaExceededUntil) {
    if (cached) return cached.payload;
    const err = new Error(
      "تم تجاوز الحد اليومي للأخبار ولا توجد بيانات محفوظة.",
    );
    err.status = 429;
    throw err;
  }

  if (inFlightNewsRequests.has(cacheKey)) {
    return inFlightNewsRequests.get(cacheKey);
  }

  const requestPromise = fetchNewsFromGNews(page, max)
    .then((payload) => {
      newsCache.set(cacheKey, { payload, fetchedAt: Date.now() });
      return payload;
    })
    .finally(() => {
      inFlightNewsRequests.delete(cacheKey);
    });

  inFlightNewsRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } catch (error) {
    if (cached) return cached.payload;
    throw error;
  }
}

export const useFetchData = () => {
  const [data, setData] = useState([]);
  const [result, setResult] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [isSmallScreen, setIsSmallScreen] = useState(
    window.matchMedia("(max-width: 767px)").matches,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleChange = () => {
      setIsSmallScreen(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const loadData = async () => {
    setError(null);
    setLoading(true);
    const max = isSmallScreen ? 2 : 6;

    try {
      if (!GNEWS_API_KEY) {
        throw new Error("Missing VITE_GNEWS_API_KEY.");
      }

      const responseData = await getNewsPage(page, max);
      const nextArticles = responseData?.articles || [];

      setData((prev) =>
        page === 1 ? nextArticles : [...prev, ...nextArticles],
      );
      setResult((prev) =>
        page === 1 ? nextArticles : [...prev, ...nextArticles],
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    const searchText = searchValue.replace(/[أإآ]/g, "ا").trim().toLowerCase();

    setResult(
      data.filter((article) =>
        article.title.replace(/[أإآ]/g, "ا").toLowerCase().includes(searchText),
      ),
    );
  }, [data, searchValue]);

  return { data, result, loading, error, searchValue, setSearchValue, setPage };
};
