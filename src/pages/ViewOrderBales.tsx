import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Shirt, Users } from "lucide-react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import mensRippedJeans from "@/assets/mens-ripped-jeans.jpg";
import mensTshirts from "@/assets/mens-tshirts.jpg";
import womensTshirts from "@/assets/womens-tshirts.jpg";
import womensZipperJackets from "@/assets/womens-zipper-jackets.jpg";
import childrensSummerWear from "@/assets/childrens-summer-wear.jpg";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image_path: string;
  image_alt_text: string;
  quantity_per_10kg: number;
  price_per_10kg: number;
  price_per_piece: number;
  age_range: string | null;
}

interface Category {
  id: number;
  name: string;
  icon_name: string;
  display_order: number;
}

const ViewOrderBales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-bale-products');
        
        if (error) throw error;
        
        if (data?.success) {
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        const message = err instanceof Error ? err.message : 'Failed to load products';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getImageForProduct = (imagePath: string) => {
    // Extract filename from path
    const filename = imagePath.split('/').pop() || imagePath;
    
    // Map database image filenames to imported assets
    const imageMap: Record<string, string> = {
      'mens-ripped-jeans.jpg': mensRippedJeans,
      'mens-tshirts.jpg': mensTshirts,
      'womens-tshirts.jpg': womensTshirts,
      'womens-zipper-jackets.jpg': womensZipperJackets,
      'childrens-summer-wear.jpg': childrensSummerWear,
    };
    return imageMap[filename] || imagePath;
  };

  const getProductsByCategory = (categoryId: number) => {
    return products.filter(p => p.category_id === categoryId);
  };
  return (
    <div>
      <Helmet>
        <title>View & Order Clothing Bales | Mixed Second-hand Items | Khanya</title>
        <meta name="description" content="View our 10kg clothing bales and place your order. Mixed men's, women's, and children's clothing including jackets, pants, shirts, dresses and more." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="order clothing bales, view clothing bales, mixed clothing items, secondhand clothing types, men's women's children's clothes, jacket pants shirts dresses" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/view-order-bales` : "/view-order-bales"} />
        <meta property="og:type" content="webpage" />
        <meta property="og:title" content="View & Order Clothing Bales | Mixed Second-hand Items | Khanya" />
        <meta property="og:description" content="View and order our 10kg mixed bales - perfect variety for resellers." />
        <meta property="og:url" content={typeof window !== "undefined" ? `${window.location.href}` : ""} />
      </Helmet>
      <Header active="bales" />

      <main>
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
          <div className="container mx-auto text-center">
            <div className="mb-6">
              <Package className="h-16 w-16 mx-auto text-primary mb-4" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              View & Order Bales
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Each 10kg bale contains approximately 40 mixed clothing items across different categories, sizes, and styles. Here's what you can expect to find.
            </p>
          </div>
        </section>

        <section className="container mx-auto py-16">
        <section className="container mx-auto py-16">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto py-8">
              <Alert variant="destructive">
                <AlertTitle>We couldn't load products</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>Try again</Button>
                <Button variant="outline" asChild>
                  <a href="/contact">Contact us</a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {categories.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category.id} className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                      {category.icon_name === 'Users' && <Users className="h-8 w-8 text-primary" />}
                      {category.icon_name === 'Shirt' && <Shirt className="h-8 w-8 text-primary" />}
                      <h2 className="text-3xl font-bold">{category.name}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={getImageForProduct(product.image_path)} 
                              alt={product.image_alt_text || `${product.name} - ${product.description.substring(0, 50)}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">
                              {product.name}
                              {product.age_range && <span className="text-sm font-normal text-muted-foreground ml-2">({product.age_range})</span>}
                            </h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {product.description}
                            </p>
                            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Per 10kg bale:</span>
                                <span className="font-semibold">~{product.quantity_per_10kg} pieces</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Bale price:</span>
                                <span className="text-2xl font-bold text-primary">R{product.price_per_10kg.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">Cost per piece:</span>
                                <span className="text-sm font-medium">~R{product.price_per_piece}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>

          <div className="bg-secondary/30 border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Important to know</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold mb-3 text-base">Mixed variety every bale</h3>
                <p className="text-muted-foreground mb-4">
                  Each bale is different and contains a random mix of clothing types, sizes, and styles. This variety gives your customers more choices and helps you serve different market segments.
                </p>
                <h3 className="font-semibold mb-3 text-base">Quality second-hand items</h3>
                <p className="text-muted-foreground">
                  All clothing is pre-sorted to ensure good resale quality. While items are second-hand, they're selected for durability and appearance suitable for retail.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-base">Weight considerations</h3>
                <p className="text-muted-foreground mb-4">
                  Heavier items like jackets and jeans mean fewer pieces per bale, while lighter items like t-shirts and children's clothes mean more pieces. The 40-item average accounts for this natural variation.
                </p>
                <h3 className="font-semibold mb-3 text-base">Seasonal availability</h3>
                <p className="text-muted-foreground">
                  Bale contents may vary slightly by season, but we maintain year-round availability of all clothing categories to keep your business consistent.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary/5 py-16">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-extrabold mb-4">Ready to see what's in your bale?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start with your first 10kg mixed bale and discover the variety that will help grow your clothing business.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="hero" size="lg" asChild>
                <a href="/contact">Order Your First Bale</a>
              </Button>
              <Button variant="sun" size="lg" asChild>
                <a href="/">See Pricing</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8 flex items-center justify-between text-sm">
          <p>&copy; {typeof window !== "undefined" ? new Date().getFullYear() : "2025"} Khanya. All rights reserved.</p>
          <a href="#" className="hover:underline">Back to top</a>
        </div>
      </footer>
    </div>
  );
};

export default ViewOrderBales;