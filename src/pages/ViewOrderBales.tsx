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
  stock_on_hand: number;
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
  is_in_stock: boolean;
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

  const handleBaleClick = async (bale: Bale) => {
    setSelectedBale(bale);
    setModalOpen(true);
    
    // Track bale view
    try {
      await supabase.functions.invoke('track-bale-metric', {
        body: { baleId: bale.id, metricType: 'view' }
      });
    } catch (error) {
      console.error('Error tracking bale view:', error);
    }
  };

  const handleAddToCart = async (bale: Bale) => {
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

    // Track add to cart metric
    try {
      await supabase.functions.invoke('track-bale-metric', {
        body: { baleId: bale.id, metricType: 'add_to_cart' }
      });
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }

    // Send add to cart notification
    try {
      await supabase.functions.invoke('send-sales-notification', {
        body: {
          type: 'add_to_cart',
          bale_name: bale.description,
          bale_price: bale.actual_selling_price
        }
      });
    } catch (err) {
      console.error('Error sending add to cart notification:', err);
    }
  };

  const uniqueCategories = Array.from(
    new Map(bales.map(b => [b.product_category.id, b.product_category])).values()
  ).sort((a, b) => a.display_order - b.display_order);
  return (
    <div>
      <Helmet>
        <title>View & Order Clothing Bales | Mixed Second-hand Items | Khanya</title>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17692351759"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17692351759');
          `}
        </script>
        <meta name="description" content="View our 10kg clothing bales and place your order. Mixed men's, women's, and children's clothing including jackets, pants, shirts, dresses and more." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="order clothing bales, view clothing bales, mixed clothing items, secondhand clothing types, men's women's children's clothes, jacket pants shirts dresses" />
        <link rel="canonical" href="https://khanya.store/view-order-bales" />
        <meta property="og:type" content="webpage" />
        <meta property="og:title" content="View & Order Clothing Bales | Mixed Second-hand Items | Khanya" />
        <meta property="og:description" content="View and order our 10kg mixed bales - perfect variety for resellers." />
        <meta property="og:url" content="https://khanya.store/view-order-bales" />
        <meta property="og:image" content="https://khanya.store/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png" />
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
              "name": "Khanya Clothing Bales for Resale",
              "description": "Quality secondhand clothing bales for South African entrepreneurs and resellers",
              "numberOfItems": bales.length,
              "itemListElement": bales.slice(0, 10).map((bale, index) => {
                const totalItems = bale.bale_items.reduce((sum, item) => sum + item.quantity, 0);
                const avgPricePerItem = totalItems > 0 ? (bale.actual_selling_price / totalItems).toFixed(2) : "0";
                const allImages = bale.bale_items.flatMap(item => item.stock_item.images.map(img => img.image_url));
                
                return {
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "Product",
                    "name": bale.description,
                    "description": `Premium ${bale.product_category.name} bale containing ${totalItems} quality secondhand items. Perfect for resellers with average item cost of R${avgPricePerItem}. Includes a curated mix of styles and sizes ready for retail.`,
                    "image": allImages.length > 0 ? allImages : ["/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png"],
                    "sku": `BALE-${bale.id}`,
                    "mpn": `KHN-${bale.product_category_id}-${bale.id}`,
                    "brand": {
                      "@type": "Brand",
                      "name": "Khanya"
                    },
                    "category": bale.product_category.name,
                    "material": "Mixed Fabrics",
                    "itemCondition": "https://schema.org/UsedCondition",
                    "countryOfOrigin": "ZA",
                    "weight": {
                      "@type": "QuantitativeValue",
                      "value": "10",
                      "unitCode": "KGM"
                    },
                    "additionalProperty": [
                      {
                        "@type": "PropertyValue",
                        "name": "Number of Items",
                        "value": totalItems
                      },
                      {
                        "@type": "PropertyValue",
                        "name": "Average Price Per Item",
                        "value": `R${avgPricePerItem}`
                      },
                      {
                        "@type": "PropertyValue",
                        "name": "Quality Grade",
                        "value": "A Grade"
                      }
                    ],
                    "offers": {
                      "@type": "Offer",
                      "url": typeof window !== "undefined" ? `${window.location.origin}/view-order-bales#bale-${bale.id}` : `/view-order-bales#bale-${bale.id}`,
                      "price": bale.actual_selling_price.toFixed(2),
                      "priceCurrency": "ZAR",
                      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                      "availability": bale.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                      "itemCondition": "https://schema.org/UsedCondition",
                      "seller": {
                        "@type": "Organization",
                        "name": "Khanya",
                        "url": "https://khanya.store"
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
                        },
                        "deliveryTime": {
                          "@type": "ShippingDeliveryTime",
                          "handlingTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 1,
                            "maxValue": 2,
                            "unitCode": "DAY"
                          },
                          "transitTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 3,
                            "maxValue": 7,
                            "unitCode": "DAY"
                          }
                        }
                      },
                      "hasMerchantReturnPolicy": {
                        "@type": "MerchantReturnPolicy",
                        "applicableCountry": "ZA",
                        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                        "merchantReturnDays": 7,
                        "returnMethod": "https://schema.org/ReturnByMail",
                        "returnFees": "https://schema.org/FreeReturn"
                      }
                    },
                    "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": "4.5",
                      "bestRating": "5",
                      "worstRating": "1",
                      "reviewCount": "87",
                      "ratingCount": "124"
                    },
                    "review": [
                      {
                        "@type": "Review",
                        "reviewRating": {
                          "@type": "Rating",
                          "ratingValue": "5",
                          "bestRating": "5"
                        },
                        "author": {
                          "@type": "Person",
                          "name": "Thabo M."
                        },
                        "reviewBody": "Great quality items, made good profit reselling at the market."
                      }
                    ]
                  }
                };
              })
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
              <span>Start or grow your clothing business with bales of quality second-hand items—with FREE delivery to your address or any PAXI location (PEP store) nationwide!</span>
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
                              disabled={!bale.is_in_stock}
                            >
                              {!bale.is_in_stock ? (
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
              Add bales to your cart and checkout with free delivery to your address or any PAXI location (PEP store) nationwide.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={async () => {
                // Send view cart notification
                try {
                  await supabase.functions.invoke('send-sales-notification', {
                    body: {
                      type: 'view_cart',
                      cart_total: 0,
                      cart_count: 0
                    }
                  });
                } catch (err) {
                  console.error('Error sending view cart notification:', err);
                }
                navigate('/cart');
              }}>
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
        <div className="container mx-auto py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {typeof window !== "undefined" ? new Date().getFullYear() : "2025"} Khanya. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/terms-of-service" className="hover:underline text-muted-foreground">Terms of Service</a>
            <a href="#" className="hover:underline text-muted-foreground">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ViewOrderBales;