import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Mission from "./pages/Mission";
import MyRecords from "./pages/MyRecords";
import Community from "./pages/Community";
import Feedback from "./pages/Feedback";
import Admin from "./pages/Admin";
import Complete from "./pages/Complete";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="max-w-lg mx-auto min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mission" element={<Navigate to="/mission/1" replace />} />
            <Route path="/mission/:week" element={<Mission />} />
            <Route path="/records" element={<MyRecords />} />
            <Route path="/community" element={<Community />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/complete" element={<Complete />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
