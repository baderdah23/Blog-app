import { lazy } from "react";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./page";
import { useFetchData } from "./hooks/useFetchData";
const ArticlePage = lazy(() => import("./page/ArticlePage"));
const NotFoundPage = lazy(() => import("./page/NotFoundPage"));

function App() {
  const { result, loading, error, searchValue, setSearchValue, setPage } =
    useFetchData();

  return (
    <>
      <BrowserRouter>
        <Header setSearchValue={setSearchValue} searchValue={searchValue} />
        <Routes>
          <Route
            path="/"
            element={
              <Home
                result={result}
                loading={loading}
                error={error}
                setPage={setPage}
              />
            }
          />
          <Route
            path="/:articleTitle"
            element={
              <ArticlePage
                result={result}
                loading={loading}
                setSearchValue={setSearchValue}
              />
            }
          />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
