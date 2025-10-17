import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Package, FolderOpen, Image } from "lucide-react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ProductManager } from "@/components/admin/ProductManager";
import { ImageManager } from "@/components/admin/ImageManager";
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

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="images">
              <Image className="h-4 w-4 mr-2" />
              Images
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductManager />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <ImageManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
