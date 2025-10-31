import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/chinese-clothing-bales.jpg";
import baleImg from "@/assets/bale-warehouse.jpg";
import flatlayImg from "@/assets/mixed-clothing-flatlay.jpg";
import marketImg from "@/assets/market-stall-r50.jpg";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.3 });
  const [active, setActive] = useState<"business" | "gallery" | "contact" | "location" | undefined>(undefined);

  // Fixed the typo in HTMLDivElement
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setCoords({ x, y });
  };

  useEffect(() => {
    const ids = ["business", "gallery", "contact"] as const;
    const observer = new IntersectionObserver(
      (entries) => {
        let candidate: { id: (typeof ids)[number]; ratio: number } | null = null;
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).id as (typeof ids)[number];
            if (!candidate || e.intersectionRatio > candidate.ratio) {
              candidate = { id, ratio: e.intersectionRatio };
            }
          }
        }
        setActive(candidate?.id);
      },
      { root: null, threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-35% 0px -55% 0px" }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Helmet>
        <title>Start Your Clothing Business from R1,000 | Wholesale Bales South Africa | Khanya</title>
        <meta name="description" content="Start your own clothing business with Khanya. Curated secondhand clothing bales from R1,000. Perfect for informal traders and entrepreneurs. Free delivery nationwide." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="start clothing business, clothing bales R1000, second hand clothes, wholesale clothing South Africa, informal trader clothing, entrepreneur clothing business, reseller bales, township business" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Start Your Clothing Business from R1,000 | Khanya" />
        <meta property="og:description" content="Build your own clothing business with curated bales from R1,000. Free delivery. 2-3× profit margins. Perfect for informal market entrepreneurs." />
        <meta property="og:url" content={typeof window !== "undefined" ? `${window.location.href}` : ""} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context":"https://schema.org",
            "@type":"Organization",
            "name":"Khanya",
            "url": typeof window !== "undefined" ? window.location.origin : "",
            "logo": "/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png",
            "contactPoint":[{"@type":"ContactPoint","contactType":"sales","email":"sales@khanya.store","telephone":"+27 82 852 1112","areaServed":"ZA"}]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context":"https://schema.org",
            "@type":"WebSite",
            "name":"Khanya",
            "url": typeof window !== "undefined" ? window.location.origin : "",
            "potentialAction": {
              "@type":"SearchAction",
              "target": typeof window !== "undefined" ? `${window.location.origin}/?q={search_term_string}` : "/?q={search_term_string}",
              "query-input":"required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      <Header active={active} />

      <main>
        <section
          onMouseMove={handleMove}
          style={{
            backgroundImage: "var(--gradient-hero)",
            ["--cursor-x" as any]: `${Math.round(coords.x * 100)}%`,
            ["--cursor-y" as any]: `${Math.round(coords.y * 100)}%`,
          } as React.CSSProperties}
          className="relative overflow-hidden"
        >
          <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center py-16">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <img
                  src="/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
                  alt="Khanya sun logo"
                  className="h-24 md:h-32 w-auto"
                  loading="lazy"
                />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur border-2 border-primary/20 rounded-full">
                  <span className="text-3xl">🇿🇦</span>
                  <span className="text-sm font-semibold text-muted-foreground">South Africa</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Start Your Own Clothing Business Today
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Khanya empowers South African entrepreneurs to build their own clothing businesses with curated bales of quality secondhand clothing. Start for as little as R1,000 and serve your community with affordable fashion.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <a href="/view-order-bales">View & order bales</a>
                </Button>
                <Button variant="sun" size="xl" asChild>
                  <a href="#business">See the numbers</a>
                </Button>
              </div>
              <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {["Start from R1,000", "Curated mixed bales", "2-3× profit margins", "Free delivery nationwide"].map((t) => (
                  <li className="flex items-start gap-2" key={t}>
                    <CheckCircle2 className="text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src={heroImg}
                alt="Compressed plastic-wrapped clothing bales from China showing mixed second-hand garments"
                className="w-full aspect-[4/3] rounded-xl shadow-[var(--shadow-elegant)] object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <section id="business" className="container mx-auto py-16">
          <header className="mb-8">
            <h2 className="text-3xl font-extrabold">Build Your Business with Khanya</h2>
            <p className="text-muted-foreground mt-2">Empowering entrepreneurs in the informal market</p>
          </header>
          <div className="space-y-4 leading-relaxed text-base">
            <p>
              <strong>Start small, dream big.</strong> Khanya makes it easy to launch your own clothing business for as little as R1,000. We curate ready-to-sell bales of quality secondhand clothing—perfect for entrepreneurs who want to serve their communities with affordable fashion that ordinary South Africans can actually afford.
            </p>
            <p>
              <strong>Choose your bale, choose your niche.</strong> Our bales contain carefully selected combinations of clothing items: men's jackets and jeans, women's dresses and tops, children's summer wear, and more. Each bale is different, giving you variety to serve different customers. Browse our bales from R1,000 to R1,600—find what works for your market.
            </p>
            <p>
              <strong>Real profit margins.</strong> Buy a bale for R1,000-R1,600 containing 30-45 quality items (depending on the type). Sell individual pieces at R50-R100 each at your market stall, street corner, or to neighbors. Many of our traders are making 2-3× their investment on each bale—that's R2,000-R4,500 from a single R1,000-R1,600 purchase.
            </p>
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-2xl">🇿🇦</span>
              <p>
                <strong>Free delivery anywhere in South Africa.</strong> We deliver your bales for free to your door, whether you're in Johannesburg, Cape Town, Durban, or a small township. No hidden costs. Just opportunity.
              </p>
            </div>
          </div>
          
          <div className="mt-8 bg-accent/10 border-2 border-accent rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3 text-accent">Your Path to Success</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-background rounded-lg p-4">
                <div className="font-bold text-lg mb-2">1. Start Small</div>
                <p className="text-muted-foreground">Order your first bale for R1,000-R1,600. Test your market and learn what sells best in your area.</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <div className="font-bold text-lg mb-2">2. Build Momentum</div>
                <p className="text-muted-foreground">Reinvest your profits. Order weekly. Build relationships with regular customers who trust your quality.</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <div className="font-bold text-lg mb-2">3. Grow Your Business</div>
                <p className="text-muted-foreground">Scale up to multiple bales per week. Hire help. Open a permanent stall. Create jobs in your community.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-secondary/50 py-16">
          <div className="container mx-auto">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold">What it looks like</h2>
              <p className="text-muted-foreground">Realistic examples of bales and mixed clothing.</p>
            </header>
            <div className="grid md:grid-cols-3 gap-6">
              {[{ src: baleImg, alt: "Wrapped bales of secondhand clothing stacked on pallets" }, { src: flatlayImg, alt: "Assorted men's, women's and children's clothing laid out neatly" }, { src: marketImg, alt: "Market table with folded clothing and R50 price cards" }, { src: "/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png", alt: "Informal trader selling affordable clothing at a township market stall" }].map((img) => (
                <figure key={img.alt} className="group overflow-hidden rounded-xl border bg-card">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary/5 py-16">
          <div className="container mx-auto">
            <header className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold mb-3">Supporting informal traders</h2>
              <p className="text-muted-foreground">Building your brand and growing your business with exclusive deals.</p>
            </header>
            
            <div className="mb-8">
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 max-w-4xl mx-auto">
                <p className="text-sm md:text-base text-center">
                  <strong>Realistic weekly goal:</strong> Sell one bale (30-45 items) per week at an average of <strong>R70-R80</strong> per item. That's <strong>R2,100-R3,600 in sales</strong> and <strong>R1,000-R2,000 profit</strong> every week to support your family.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-accent h-6 w-6" />
                  <h3 className="font-bold text-lg">Goal Achieved Reward</h3>
                </div>
                <p className="text-muted-foreground mb-4">Place a second order within 1 week of your previous order to receive:</p>
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <p className="font-semibold text-accent">10 free coat-hangers</p>
                  <p className="text-sm text-muted-foreground mt-1">Perfect for displaying your clothing professionally</p>
                </div>
              </div>
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-accent h-6 w-6" />
                  <h3 className="font-bold text-lg">Brand Builder Package</h3>
                </div>
                <p className="text-muted-foreground mb-4">Order 8 bales in a month to receive your choice of:</p>
                <div className="space-y-2">
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                    <p className="font-semibold text-accent">8 free Khanya branded caps</p>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">OR</div>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                    <p className="font-semibold text-accent">8 free Khanya branded t-shirts</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">Use yourself or give to your favourite customers!</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="container mx-auto py-16">
          <div className="bg-card border rounded-2xl p-8 md:p-12 text-center shadow-[var(--shadow-elegant)]">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🇿🇦</span>
              <h2 className="text-3xl font-extrabold">Ready to start?</h2>
            </div>
            <p className="text-muted-foreground mb-6">Get pricing, availability and delivery options for your area in South Africa.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="hero" size="lg" asChild>
                <a href="mailto:sales@khanya.store?subject=Khanya%20Bales%20Enquiry">Email sales@khanya.store</a>
              </Button>
              <Button variant="sun" size="lg" asChild>
                <a href="https://wa.me/27828521112" target="_blank" rel="noreferrer">WhatsApp +27 82 852 1112</a>
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

export default Index;