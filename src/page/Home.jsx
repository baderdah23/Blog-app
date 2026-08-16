import ArticleCard from "../components/ArticleCard";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import NoResult from "../components/NoResult";

export const Home = ({ result, loading, error, setPage }) => {
  const onClickHandler = () => {
    setPage((prev) => (prev += 1));
  };
  return (
    <section className="mb-15 flex flex-col items-center justify-center">
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          {loading ? (
            <Loader type="home" />
          ) : (
            <>
              {result.length ? (
                <>
                  <div className="flex flex-wrap justify-center gap-5">
                    {result?.length !== 0 &&
                      result?.map((article) => (
                        <ArticleCard
                          key={article.id}
                          title={article.title}
                          img={article.image}
                          authorImg={article.source.url}
                          authorName={article.source.name}
                          date={article.publishedAt.split("T")[0]}
                        />
                      ))}
                  </div>
                  <button
                    onClick={onClickHandler}
                    className="mt-5 w-fit rounded-md border-1 border-[#696A754D] px-5 py-3 text-[#696A75]"
                  >
                    Load More
                  </button>
                </>
              ) : (
                <NoResult />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
