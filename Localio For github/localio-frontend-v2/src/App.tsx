import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { Layout } from "./components/navigation/Layout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Nearby from "./pages/Nearby";
import Search from "./pages/Search";
import Place from "./pages/Place";
import WriteReview from "./pages/WriteReview";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import VendorOnboarding from "./pages/VendorOnboarding";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import VendorRedirect from "./pages/VendorRedirect";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/nearby" element={<Nearby />} />
            <Route path="/search" element={<Search />} />
            <Route path="/place/:id" element={<Place />} />
            <Route path="/write-review" element={<WriteReview />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
            <Route path="/vendor/dashboard/:id" element={<VendorDashboardPage />} />
            <Route path="/vendor" element={<VendorRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
