import { useParams } from "react-router";
import Loader from "../components/Loader";
import { useEffect } from "react";
import { NotFoundPage } from "./NotFoundPage";

export const ArticlePage = ({ result, loading, setSearchValue }) => {
  const { articleTitle } = useParams();

  const articleData = result?.find((article) => article.title === articleTitle);

  const dummyContent = [
    {
      title: "مقدمة ونظرة عامة على الموضوع",
      text: "في ظل التطورات التكنولوجية السريعة التي يشهدها العالم اليوم، أصبحت هذه التقنيات جزءاً لا يتجزأ من حياتنا اليومية. تساعدنا هذه الحلول على تحسين الكفاءة وتسهيل المهام اليومية بشكل ملحوظ.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
    },
    {
      title: "التأثير المستقبلي والحلول الذكية",
      text: "الاعتماد على التقنيات الحديثة يفتح آفاقاً جديدة للابتكار والتطوير. التوجه نحو الأتمتة واستخدام الذكاء الاصطناعي يسهم في خلق بيئة عمل أكثر مرونة وإنتاجية مع تقليل الأخطاء البشرية.",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    },
    {
      title: "التحديات وأفضل الممارسات",
      text: "بالرغم من المزايا العديدة، تتطلب هذه التغييرات استراتيجيات حذرة للتعامل مع التحديات مثل الأمان الرقمي وحماية البيانات، لضمان استمرارية النجاح والاستفادة القصوى من الأدوات المتاحة.",
    },
  ];
  useEffect(() => {
    setSearchValue("");
  }, []);

  return (
    <div className="mb-10 flex flex-col items-center gap-6">
      {loading ? (
        <Loader />
      ) : (
        <>
          {articleData ? (
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
                {dummyContent.map((item, index) => (
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
