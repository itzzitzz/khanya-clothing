import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Shirt, Users, ShoppingCart, Plus, Award } from "lucide-react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BaleDetailModal } from "@/components/BaleDetailModal";
import { Badge } from "@/components/ui/badge";
import saFlag from "@/assets/south-africa-flag.png";

interface StockItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface StockItem {
  id: number;
  name: string;
  description: string;
  age_range: string;
  selling_price: number;
  images: StockItemImage[];
}

interface BaleItem {
  id: number;
  quantity: number;
  line_item_price: number;
  stock_item: StockItem;
}

interface ProductCategory {
  id: number;
  name: string;
  description: string;
  display_order: number;
}

interface Bale {
  id: number;
  description: string;
  actual_selling_price: number;
  recommended_sale_price: number;
  total_cost_price: number;
  bale_profit: number;
  bale_margin_percentage: number;
  display_order: number;
  product_category_id: number;
  quantity_in_stock: number;
  product_category: ProductCategory;
  bale_items: BaleItem[];
}

const ViewOrderBales = () => {
  const [bales, setBales] = useState<Bale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBale, setSelectedBale] = useState<Bale | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBales = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-bales');
        
        if (error) throw error;
        
        if (data?.success) {
          setBales(data.bales || []);
        }
      } catch (err) {
        console.error('Error fetching bales:', err);
        const message = err instanceof Error ? err.message : 'Failed to load bales';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBales();
  }, []);

  const getBalesByCategory = (categoryId: number) => {
    return bales.filter(b => b.product_category_id === categoryId);
  };

  const getRandomBaleImage = (bale: Bale): string => {
    const allImages: StockItemImage[] = [];
    bale.bale_items.forEach(item => {
      allImages.push(...item.stock_item.images);
    });
    if (allImages.length === 0) return '/placeholder.svg';
    const randomIndex = Math.floor(Math.random() * allImages.length);
    return allImages[randomIndex].image_url;
  };

  const handleBaleClick = (bale: Bale) => {
    setSelectedBale(bale);
    setModalOpen(true);
  };

  const handleAddToCart = (bale: Bale) => {
    addToCart({
      product_id: bale.id,
      product_name: bale.description,
      product_image: getRandomBaleImage(bale),
      price_per_unit: bale.actual_selling_price,
    });
    toast({
      title: "Added to cart",
      description: `${bale.description} added to your cart`,
    });
  };

  const uniqueCategories = Array.from(
    new Map(bales.map(b => [b.product_category.id, b.product_category])).values()
  ).sort((a, b) => a.display_order - b.display_order);
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
        <meta property="og:image" content={typeof window !== "undefined" ? `${window.location.origin}/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png` : ""} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Clothing Bales for Resale",
            "description": "Browse our selection of 10kg clothing bales perfect for resellers and entrepreneurs.",
            "url": typeof window !== "undefined" ? `${window.location.origin}/view-order-bales` : "/view-order-bales",
            "provider": {
              "@type": "Organization",
              "name": "Khanya",
              "url": typeof window !== "undefined" ? window.location.origin : ""
            }
          })}
        </script>
        {bales.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": bales.slice(0, 10).map((bale, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": bale.description,
                  "description": `Mixed ${bale.product_category.name} bale containing ${bale.bale_items.reduce((sum, item) => sum + item.quantity, 0)} quality secondhand items`,
                  "image": getRandomBaleImage(bale),
                  "offers": {
                    "@type": "Offer",
                    "price": bale.actual_selling_price.toFixed(2),
                    "priceCurrency": "ZAR",
                    "availability": bale.quantity_in_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "seller": {
                      "@type": "Organization",
                      "name": "Khanya"
                    },
                    "shippingDetails": {
                      "@type": "OfferShippingDetails",
                      "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": "0",
                        "currency": "ZAR"
                      },
                      "shippingDestination": {
                        "@type": "DefinedRegion",
                        "addressCountry": "ZA"
                      }
                    }
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.5",
                    "reviewCount": "87"
                  }
                }
              }))
            })}
          </script>
        )}
      </Helmet>
      <Header active="bales" />

      <main>
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
          <div className="container mx-auto text-center">
            <div className="mb-6">
              <Package className="h-16 w-16 mx-auto text-primary mb-4" />
            </div>
            <div className="flex justify-center mb-4">
              <Badge variant="default" className="text-lg px-6 py-2 bg-primary hover:bg-primary/90 flex items-center gap-2">
                <Award className="h-5 w-5" />
                High Quality A Grade
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              View & Order Bales
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto inline-flex items-center justify-center gap-2 flex-wrap">
              <span>Start or grow your clothing business with curated bales of quality second-hand items—with FREE delivery anywhere in South Africa!</span>
              <img src={saFlag} alt="South Africa flag" className="w-8 h-5 object-cover rounded-sm inline-block" />
            </p>
          </div>
        </section>

        <section className="container mx-auto py-16">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading bales...</p>
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto py-8">
              <Alert variant="destructive">
                <AlertTitle>We couldn't load bales</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>Try again</Button>
                <Button variant="outline" asChild>
                  <a href="/contact">Contact us</a>
                </Button>
              </div>
            </div>
          ) : bales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bales available at the moment.</p>
            </div>
          ) : (
            <>
              {uniqueCategories.map((category) => {
                const categoryBales = getBalesByCategory(category.id);
                if (categoryBales.length === 0) return null;

                return (
                  <div key={category.id} className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                      <Package className="h-8 w-8 text-primary" />
                      <h2 className="text-3xl font-bold">{category.name}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {categoryBales.map((bale) => (
                        <div 
                          key={bale.id} 
                          className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                          onClick={() => handleBaleClick(bale)}
                        >
                          <div className="aspect-square overflow-hidden relative bg-muted/20 flex items-center justify-center">
                            <img 
                              src={getRandomBaleImage(bale)} 
                              alt={bale.description}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 bg-background/90 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                              {bale.bale_items.reduce((sum, item) => sum + item.quantity, 0)} items
                            </div>
                          </div>
                          <div className="p-2 sm:px-3 sm:pt-2 sm:pb-2.5">
                            <h3 className="text-xs sm:text-sm font-bold mb-1.5 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                              {bale.description}
                            </h3>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm sm:text-base font-bold text-primary">R{bale.actual_selling_price.toFixed(2)}</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                Avg R{(bale.actual_selling_price / bale.bale_items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)}/item
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full h-7 sm:h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(bale);
                              }}
                              disabled={bale.quantity_in_stock === 0}
                            >
                              {bale.quantity_in_stock === 0 ? (
                                "Out of Stock"
                              ) : (
                                <>
                                  <ShoppingCart className="h-2.5 w-2.5 mr-1" />
                                  Add to Cart
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className="bg-secondary/30 border rounded-xl p-8 mt-8">
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
            <h2 className="text-3xl font-extrabold mb-4">Ready to order?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Add bales to your cart and checkout with free delivery anywhere in South Africa.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/cart')}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                View Cart
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/track-order')}>
                Track My Order
              </Button>
            </div>
            <div className="mt-6">
              <a href="/location" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                View payment methods and location info
              </a>
            </div>
          </div>
        </section>
      </main>

      <BaleDetailModal
        bale={selectedBale}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddToCart={handleAddToCart}
      />

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