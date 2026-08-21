import { useParams } from "react-router";
import Loader from "../components/Loader";
import { useEffect, useState } from "react";
import { NotFoundPage } from "./NotFoundPage";

export const ArticlePage = ({ result, loading, setSearchValue }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [articleContent, setArticleContent] = useState([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const { articleTitle } = useParams();

  const articleData = result?.find((article) => article.title === articleTitle);

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

  const contentList = articleContent?.article?.content || [];

  useEffect(() => {
    setSearchValue("");
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
              <div className="flex w-full max-w-4xl flex-col gap-10 p-5">
                {contentList.map((item, index) => (
                  <div key={index} className="flex flex-col gap-5">
                    {item?.image && (
                      <img
                        className="max-h-115.5 w-150 self-center rounded-lg"
                        src={item.image}
                        alt="article section picture"
                        loading="lazy"
                      />
                    )}
                    {item?.title && (
                      <h2 className="text-2xl font-semibold">{item.title}</h2>
                    )}
                    {item?.text && <p className="leading-8">{item.text}</p>}

                    {index === 1 && (
                      <div className="my-5 flex w-full flex-col gap-1 self-center rounded-xl bg-[#E8E8EA] p-5 text-center text-[#696A75]">
                        <span>Advertisement</span>
                        <span className="text-xl font-semibold">
                          You can place ads
                        </span>
                        <span>750x100</span>
                      </div>
                    )}
                  </div>
                ))}

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
