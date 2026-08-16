import { useParams } from "react-router";
import Loader from "../components/Loader";
import { useEffect, useState } from "react";
import { NotFoundPage } from "./NotFoundPage";

export const ArticlePage = ({ result, loading }) => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const [articleContent, setArticleContent] = useState([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const { articleTitle } = useParams();

  const articleData = result?.find((article) => article.title === articleTitle);

  console.log(result);
  console.log(articleData);

  const getArticleContent = async () => {
    setArticleLoading(true);
    if (!articleData?.url) {
      setArticleLoading(false);
      return;
    }
    const response = await fetch(
      `${backendUrl}/api/article?url=${encodeURIComponent(articleData?.url)}`,
    );
    const content = await response.json();
    setArticleContent(content);
    setArticleLoading(false);
  };

  useEffect(() => {
    getArticleContent();
  }, [articleData]);
  return (
    <div className="mb-10 flex flex-col items-center gap-6">
      {loading || articleLoading ? (
        <Loader />
      ) : (
        <>
          {articleContent.length || articleData ? (
            <>
              <div className="flex flex-col gap-5 self-start p-2">
                <span className="w-fit rounded-md bg-[#4B6BFB] px-2.5 py-1 font-medium text-white">
                  Technology
                </span>
                <h1 className="text-4xl font-semibold">{articleData?.title}</h1>
                <div className="flex items-center gap-5">
                  <img
                    className="h-12 w-12 rounded-lg"
                    src={`https://www.google.com/s2/favicons?domain=${articleData?.source.url}&sz=64`}
                    alt={`logo by ${articleData?.source.name}`}
                    loading="lazy"
                  />
                  <span className="text-[#696A75]">
                    {articleData?.source.name}
                  </span>
                  <span className="text-[#696A75]">
                    {articleData?.publishedAt.split("T")[0]}
                  </span>
                </div>
              </div>
              <img
                className="max-h-115.5 w-150 rounded-lg"
                src={articleData?.image}
                alt="article picture"
                loading="lazy"
              />
              <div className="flex flex-col gap-10 p-5">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {articleContent?.article?.content[0]?.title}
                  </h2>
                  <p className="leading-8">
                    {articleContent?.article?.content[0]?.text}
                  </p>
                </div>
                <div className="flex flex-col gap-5">
                  {articleContent?.article?.content[1]?.image && (
                    <img
                      className="max-h-115.5 w-150 self-center rounded-lg"
                      src={articleContent?.article?.content[1]?.image}
                      alt="article picture"
                      loading="lazy"
                    />
                  )}
                  <h2 className="text-2xl font-semibold">
                    {articleContent?.article?.content[1]?.title}
                  </h2>
                  <p className="leading-8">
                    {articleContent?.article?.content[1]?.text}
                  </p>
                </div>
                <div className="flex w-187.5 flex-col gap-1 self-center rounded-xl bg-[#E8E8EA] p-5 text-center text-[#696A75]">
                  <span>Advertisement</span>
                  <span className="text-xl font-semibold">
                    You can place ads
                  </span>
                  <span>750x100</span>
                </div>
                <div className="flex flex-col gap-5">
                  {articleContent?.article?.content[2]?.image && (
                    <img
                      className="max-h-115.5 w-150 self-center rounded-lg"
                      src={articleContent?.article?.content[2]?.image}
                      alt="article picture"
                      loading="lazy"
                    />
                  )}

                  <h2 className="text-2xl font-semibold">
                    {articleContent?.article?.content[2]?.title}
                  </h2>
                  <p className="leading-8">
                    {articleContent?.article?.content[2]?.text}
                  </p>
                </div>
                <div className="flex flex-col gap-5">
                  {articleContent?.article?.content[3]?.image && (
                    <img
                      className="max-h-115.5 w-150 self-center rounded-lg"
                      src={articleContent?.article?.content[3]?.image}
                      alt="article picture"
                      loading="lazy"
                    />
                  )}

                  <h2 className="text-2xl font-semibold">
                    {articleContent?.article?.content[3]?.title}
                  </h2>
                  <p className="leading-8">
                    {articleContent?.article?.content[3]?.text}
                  </p>
                </div>
                <div className="flex flex-col gap-5">
                  {articleContent?.article?.content[4]?.image && (
                    <img
                      className="max-h-115.5 w-150 self-center rounded-lg"
                      src={articleContent?.article?.content[4]?.image}
                      alt="article picture"
                      loading="lazy"
                    />
                  )}
                  <h2 className="text-2xl font-semibold">
                    {articleContent?.article?.content[4]?.text}
                  </h2>
                  <p className="leading-8">
                    {articleContent?.article?.content[4]?.text}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    رابط المقال الرسمي:{" "}
                    <a
                      target="_blank"
                      className="cursor-pointer text-blue-500"
                      href={articleData?.url}
                    >
                      من هنــــا
                    </a>
                  </h2>
                </div>
              </div>
            </>
          ) : (
            <NotFoundPage />
          )}
        </>
      )}
    </div>
  );
};
