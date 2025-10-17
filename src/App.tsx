import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Location from "./pages/Location";
import Brand from "./pages/Brand";
import Contact from "./pages/Contact";
import ViewOrderBales from "./pages/ViewOrderBales";
import AdminImportImages from "./pages/AdminImportImages";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/location" element={<Location />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/view-order-bales" element={<ViewOrderBales />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin-import-images" element={<AdminImportImages />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
