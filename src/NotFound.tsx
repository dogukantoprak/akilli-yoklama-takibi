import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {isLoggedIn && <Sidebar />}

      <main className={`flex-1 ${isLoggedIn ? "lg:ml-64" : ""} flex items-center justify-center`}>
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="text-xl text-gray-600 mt-4 mb-8">Sayfa bulunamadı</p>
          <Button
            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoggedIn ? "Ana Panele Dön" : "Giriş Sayfasına Dön"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
