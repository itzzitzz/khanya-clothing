import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Shirt, Users } from "lucide-react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import mensRippedJeans from "@/assets/mens-ripped-jeans.jpg";
import mensTshirts from "@/assets/mens-tshirts.jpg";
import womensTshirts from "@/assets/womens-tshirts.jpg";
import womensZipperJackets from "@/assets/womens-zipper-jackets.jpg";
import childrensSummerWear from "@/assets/childrens-summer-wear.jpg";

const WhatsInBales = () => {
  return (
    <div>
      <Helmet>
        <title>What's in Our Clothing Bales | Mixed Second-hand Items | Khanya</title>
        <meta name="description" content="Discover what's inside our 10kg clothing bales. Mixed men's, women's, and children's clothing including jackets, pants, shirts, dresses and more." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="clothing bale contents, mixed clothing items, secondhand clothing types, men's women's children's clothes, jacket pants shirts dresses" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/whats-in-bales` : "/whats-in-bales"} />
        <meta property="og:type" content="webpage" />
        <meta property="og:title" content="What's in Our Clothing Bales | Mixed Second-hand Items | Khanya" />
        <meta property="og:description" content="See exactly what types of clothing you'll find in our 10kg mixed bales - perfect variety for resellers." />
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
              What's in the bales?
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Each 10kg bale contains approximately 40 mixed clothing items across different categories, sizes, and styles. Here's what you can expect to find.
            </p>
          </div>
        </section>

        <section className="container mx-auto py-16">
          {/* Men's Clothing Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Men's Clothing</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6">
                <img 
                  src={mensRippedJeans} 
                  alt="Men's ripped jeans - distressed denim for resale" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">Ripped Jeans</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Trendy distressed denim jeans with fashionable tears and fraying. Perfect for casual streetwear market.
                </p>
                <div className="text-sm">
                  <p className="font-medium">10kg = ~20 pairs</p>
                  <p className="text-xl font-bold text-primary">R1,000</p>
                  <p className="text-muted-foreground">~R50 per pair</p>
                </div>
              </div>
              
              <div className="bg-card border rounded-xl p-6">
                <img 
                  src={mensTshirts} 
                  alt="Men's casual t-shirts in various colors and styles" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">T-Shirts</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Comfortable cotton blend t-shirts in various colors and styles. Essential everyday wear items.
                </p>
                <div className="text-sm">
                  <p className="font-medium">10kg = ~40 pieces</p>
                  <p className="text-xl font-bold text-primary">R2,000</p>
                  <p className="text-muted-foreground">~R50 per piece</p>
                </div>
              </div>
            </div>
          </div>

          {/* Women's Clothing Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-accent" />
              <h2 className="text-2xl font-bold">Women's Clothing</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6">
                <img 
                  src={womensTshirts} 
                  alt="Women's fashionable t-shirts and tops in various styles" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">T-Shirts</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Stylish women's t-shirts and tops in various cuts and designs. Perfect for casual and semi-casual wear.
                </p>
                <div className="text-sm">
                  <p className="font-medium">10kg = ~40 pieces</p>
                  <p className="text-xl font-bold text-primary">R2,000</p>
                  <p className="text-muted-foreground">~R50 per piece</p>
                </div>
              </div>
              
              <div className="bg-card border rounded-xl p-6">
                <img 
                  src={womensZipperJackets} 
                  alt="Women's zipper jackets and hoodies for casual outerwear" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">Zipper Jackets</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Comfortable hoodies and jackets with full front zippers. Great layering pieces for all seasons.
                </p>
                <div className="text-sm">
                  <p className="font-medium">10kg = ~23 pieces</p>
                  <p className="text-xl font-bold text-primary">R1,000</p>
                  <p className="text-muted-foreground">~R44 per piece</p>
                </div>
              </div>
            </div>
          </div>

          {/* Children's Clothing Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shirt className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Children's Clothing</h2>
            </div>
            <div className="grid md:grid-cols-1 max-w-md mx-auto">
              <div className="bg-card border rounded-xl p-6">
                <img 
                  src={childrensSummerWear} 
                  alt="Children's summer clothing for ages 5-12, colorful and fun designs" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">Mixed Summer Wear (ages 5-12)</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Bright and colorful summer clothing including shorts, t-shirts, and sundresses. Perfect for active kids.
                </p>
                <div className="text-sm">
                  <p className="font-medium">10kg = ~57 items</p>
                  <p className="text-xl font-bold text-primary">R2,900</p>
                  <p className="text-muted-foreground">~R50 per item</p>
                </div>
              </div>
            </div>
          </div>

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

export default WhatsInBales;