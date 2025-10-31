import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Khanya</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to Khanya homepage to browse our clothing bales or contact us for assistance." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4 max-w-md">
          <h1 className="text-6xl font-extrabold mb-4 text-primary">404</h1>
          <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="hero" size="lg">
              <a href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/view-order-bales">
                <Search className="mr-2 h-5 w-5" />
                Browse Bales
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
