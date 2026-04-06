import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout"
import { MemoriesPage } from "./pages/memories"
import { SearchPage } from "./pages/search"
import { AddMemoryPage } from "./pages/add-memory"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MemoriesPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="add" element={<AddMemoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
