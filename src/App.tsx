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
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import OrderConfirmation from "./pages/OrderConfirmation";
import PackingList from "./pages/PackingList";
import BalePackingList from "./pages/BalePackingList";
import Invoice from "./pages/Invoice";
import PrintOrder from "./pages/PrintOrder";
import PrintPackingLists from "./pages/PrintPackingLists";
import TermsOfService from "./pages/TermsOfService";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import Reviews from "./pages/Reviews";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <CartProvider>
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/packing-list" element={<PackingList />} />
              <Route path="/bale-packing-list" element={<BalePackingList />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/print-order" element={<PrintOrder />} />
              <Route path="/print-packing-lists" element={<PrintPackingLists />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/reviews" element={<Reviews />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
