import { useState } from "react";
import Header from "./components/Header";

import { BrowserRouter, Routes, Route } from "react-router";
import { ArticlePage, Home, NotFoundPage } from "./page";
import { useFetchData } from "./hooks/useFetchData";

function App() {
  const { result, loading, error, setSearchValue, setPage } = useFetchData();

  return (
    <>
      <BrowserRouter>
        <Header setSearchValue={setSearchValue} />
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
            element={<ArticlePage result={result} loading={loading} />}
          />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
