import { Link } from "react-router";

function ArticleCard({ index, title, img, authorImg, authorName, date }) {
  return (
    <div className="flex w-98 flex-col gap-4 rounded-lg border-1 border-[#E8E8EA] p-4">
      <img
        className="h-60 w-90 rounded-lg"
        src={img}
        alt="article picture"
        loading={index > 2 ? "lazy" : "eager"}
        fetchPriority={index < 3 ? "high" : "auto"}
      />
      <div className="flex w-90 flex-col gap-5 p-2">
        <span className="w-fit rounded-md bg-[#4B6BFB0D] px-2.5 py-1 font-medium text-[#4B6BFB]">
          Technology
        </span>
        <Link
          to={`/${title}`}
          className="cursor-pointer rounded-md p-3 text-2xl font-semibold duration-300 hover:bg-black/5"
        >
          {title}
        </Link>
        <div className="flex items-center gap-5">
          <img
            className="h-12 w-12 rounded-full"
            src={`https://www.google.com/s2/favicons?domain=${authorImg}&sz=64`}
            alt=""
            loading="lazy"
          />
          <span className="text-[#97989F]">{authorName}</span>
          <span className="text-[#97989F]">{date}</span>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
