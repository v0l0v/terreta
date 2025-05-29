import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Map from "./pages/Map";
import CreateCache from "./pages/CreateCache";
import CacheDetail from "./pages/CacheDetail";
import NotFound from "./pages/NotFound";
import { MobileNav } from "@/components/MobileNav";

export function AppRouter() {
  return (
    <BrowserRouter>
      <MobileNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/create" element={<CreateCache />} />
        <Route path="/cache/:dtag" element={<CacheDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;