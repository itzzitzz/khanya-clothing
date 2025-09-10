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
        <title>Bulk Clothing Bales | Second-hand Wholesale South Africa | Khanya</title>
        <meta name="description" content="Buy affordable bulk clothing bales (10kg) for resale. Second-hand clothing supplier in South Africa. Mixed men's & women's clothing and children's clothing." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="bulk clothing, clothing bales, second hand clothes, second-hand clothing, wholesale clothing South Africa, used clothes bales, 10kg bales, reseller clothing, children's clothing" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bulk Clothing Bales | Second-hand Wholesale South Africa | Khanya" />
        <meta property="og:description" content="Affordable bulk second-hand clothing bales (10kg) for South African resellers. Great ROI, mixed clothing for men, women, and children." />
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
              <div className="mb-4">
                <img
                  src="/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
                  alt="Khanya sun logo"
                  className="h-24 md:h-32 w-auto"
                  loading="lazy"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Khanya: Affordable bulk new and secondhand clothing in South Africa!
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                We supply 10kg bales of mixed men's, women's and children's clothing so entrepreneurs can resell at low prices that ordinary South Africans can afford.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <a href="/contact">Get a Quote</a>
                </Button>
                <Button variant="sun" size="xl" asChild>
                  <a href="#business">See the numbers</a>
                </Button>
              </div>
              <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {["10kg bales (~40 items)", "R1,600 per bale (~R40 per item)", "Resell at ~R80 per item", "2× return on investment"].map((t) => (
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
            <h2 className="text-3xl font-extrabold">The business</h2>
          </header>
          <div className="space-y-4 leading-relaxed text-base">
            <p>
              Khanya provides affordable secondhand clothing in bulk to entrepreneurs who want to earn an income by serving their communities. Most people in South Africa can't pay R250 for a brand-new pair of jeans, but with Khanya bales, you can offer quality clothes at half the price.
            </p>
            <p>
              We sell 10kg bales containing a variety of men's, women's and children's items: jackets, pants, shirts, skirts, dresses, shorts and kidswear. Clothing weights differ—jackets weigh more than T‑shirts, and children's clothes are typically lighter.
            </p>
            <p>
              Each bale sells for <strong>R1,600</strong>. That's about <strong>R40 per item</strong>. Resellers commonly price pieces at around <strong>R80</strong>, which means you can really double your investment.
            </p>
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
                  <strong>Goal for informal traders:</strong> Sell about <strong>40 items/week</strong> (one 10kg bale) at an average of <strong>R80</strong> per item to make roughly <strong>R1,600 profit</strong> and <strong>R3,200 sales</strong>.
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
            <h2 className="text-3xl font-extrabold mb-3">Ready to start?</h2>
            <p className="text-muted-foreground mb-6">Get pricing, availability and delivery options for your area.</p>
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