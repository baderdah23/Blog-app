import { useEffect, useState } from "react";

export const useFetchData = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [data, setData] = useState([]);
  const [result, setResult] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/news?page=${page}`);

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.errors?.[0] || "Failed to load news.");
      }

      if (responseData.errors) {
        throw new Error(responseData.errors[0]);
      }

      if (responseData.articles) {
        const nextArticles = responseData.articles;

        setData((prev) =>
          page === 1 ? nextArticles : [...prev, ...nextArticles],
        );
      }
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
    const searchText = searchValue.trim().toLowerCase();

    setResult(
      data.filter((article) =>
        article.title.toLowerCase().includes(searchText),
      ),
    );
  }, [data, searchValue]);

  return { data, result, loading, error, setSearchValue, setPage };
};
