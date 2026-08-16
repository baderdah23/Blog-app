import noResultIcon from "../assets/search.png";

const NoResult = () => {
  return (
    <div className="flex h-[calc(100vh-208px)] flex-col items-center justify-center gap-10">
      <img src={noResultIcon} alt="no result icon" loading="lazy" />
      <h1 className="text-4xl font-bold">Result is not found</h1>
    </div>
  );
};
export default NoResult;
