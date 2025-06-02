import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingCard } from "@/components/ui/loading";
import { MobileHeader, MobileBottomNav } from "@/components/MobileNav";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const CreateCache = lazy(() => import("./pages/CreateCache"));
const CacheDetail = lazy(() => import("./pages/CacheDetail"));
const MyCaches = lazy(() => import("./pages/MyCaches"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Install = lazy(() => import("./pages/Install"));
const Claim = lazy(() => import("./pages/Claim"));

const NotFound = lazy(() => import("./pages/NotFound"));

export function AppRouter() {
  return (
    <BrowserRouter>
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content Area - with bottom padding for mobile nav */}
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<LoadingCard title="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/create" element={<CreateCache />} />
            <Route path="/saved" element={<MyCaches />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:pubkey" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/install" element={<Install />} />
            <Route path="/claim" element={<Claim />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE NADDR CATCH-ALL ROUTE */}
            <Route path="/:naddr" element={<CacheDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      
      {/* Mobile Bottom Navigation - Fixed positioned */}
      <MobileBottomNav />
    </BrowserRouter>
  );
}
export default AppRouter;