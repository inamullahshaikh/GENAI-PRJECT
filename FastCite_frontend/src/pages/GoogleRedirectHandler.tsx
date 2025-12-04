import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GoogleRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Read token from query string
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // Store token in localStorage (or sessionStorage)
      localStorage.setItem("accessToken", token);
      console.log(token)
      
      // Check if user is admin and redirect accordingly
      const checkAdminAndRedirect = async () => {
        try {
          const response = await fetch("http://localhost:8000/users/getmyprofile/me", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.role === "admin") {
              const newUrl = location.pathname.replace("/auth/google/callback", "/admin/dashboard");
              window.history.replaceState({}, document.title, newUrl);
              navigate("/admin/dashboard", { replace: true });
              return;
            }
          }
        } catch (err) {
          console.error("Error checking user role:", err);
        }
        
        // Default redirect to dashboard
        const newUrl = location.pathname.replace("/auth/google/callback", "/dashboard");
        window.history.replaceState({}, document.title, newUrl);
        navigate("/dashboard", { replace: true });
      };
      
      checkAdminAndRedirect();
    } else {
      // If no token, send to login
      navigate("/login", { replace: true });
    }
  }, [navigate, location]);

  return <div>Logging in...</div>;
};

export default GoogleRedirectHandler;
