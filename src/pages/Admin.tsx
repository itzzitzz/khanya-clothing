import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Package, FolderOpen, ShoppingCart, Box, Tags, BarChart3, Megaphone } from "lucide-react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { StockItemManager } from "@/components/admin/StockItemManager";
import { BaleManager } from "@/components/admin/BaleManager";
import { ProductCategoryManager } from "@/components/admin/ProductCategoryManager";
import OrderManager from "@/components/admin/OrderManager";
import BaleMetricsManager from "@/components/admin/BaleMetricsManager";
import { MarketingManager } from "@/components/admin/MarketingManager";
import Header from "@/components/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
      }

      setIsAdmin(!!roles);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div>
        <Header />
        <main className="container mx-auto py-16 px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <Header />
        <main className="container mx-auto py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have admin permissions. Please contact the administrator to grant you access.
                <br />
                <br />
                Logged in as: <strong>{userEmail}</strong>
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={handleLogout}>
                Log Out
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Logged in as {userEmail}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        <Tabs defaultValue="stock-categories" className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto">
            <TabsTrigger value="stock-categories" className="flex-shrink-0">
              <FolderOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stock Categories</span>
              <span className="sm:hidden">Stock Cat.</span>
            </TabsTrigger>
            <TabsTrigger value="stock-items" className="flex-shrink-0">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stock Items</span>
              <span className="sm:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="product-categories" className="flex-shrink-0">
              <Tags className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Product Categories</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
            <TabsTrigger value="build-bales" className="flex-shrink-0">
              <Box className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Build Bales</span>
              <span className="sm:hidden">Bales</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-shrink-0">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-shrink-0">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Metrics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex-shrink-0">
              <Megaphone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Marketing</span>
              <span className="sm:hidden">Market</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock-categories" className="mt-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="stock-items" className="mt-6">
            <StockItemManager />
          </TabsContent>

          <TabsContent value="product-categories" className="mt-6">
            <ProductCategoryManager />
          </TabsContent>

          <TabsContent value="build-bales" className="mt-6">
            <BaleManager />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrderManager />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <BaleMetricsManager />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
