import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-bales.jpg";
import baleImg from "@/assets/bale-warehouse.jpg";
import flatlayImg from "@/assets/mixed-clothing-flatlay.jpg";
import marketImg from "@/assets/market-stall-r50.jpg";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.3 });
  const [active, setActive] = useState<"business" | "gallery" | "contact" | "location" | undefined>(undefined);

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
        <meta name="description" content="Buy affordable bulk clothing bales (35kg) for resale. Second-hand clothing supplier in South Africa. Mixed men’s & women’s clothing and children's clothing. Great ROI for traders." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="bulk clothing, clothing bales, second hand clothes, second-hand clothing, wholesale clothing South Africa, used clothes bales, 35kg bales, reseller clothing, Khanya" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bulk Clothing Bales | Second-hand Wholesale South Africa | Khanya" />
        <meta property="og:description" content="Affordable bulk second-hand clothing bales (35kg) for South African resellers. Great ROI, mixed clothing for men and women." />
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
                Khanya: Affordable bulk new and secondhand clothing in South Africa!!!
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                We supply 35kg bales of mixed men’s and women’s clothing so entrepreneurs can resell at prices ordinary South Africans can afford.
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
                {[
                  "35kg bales (~100 items)",
                  "R6,500 per bale (~R65 per item)",
                  "Resell at ~R130 per item",
                  "2× return on investment",
                ].map((t) => (
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
                alt="Neat stacks of secondhand clothing bales in a clean warehouse"
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
          <article className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 leading-relaxed text-base">
              <p>
                Khanya provides affordable secondhand clothing in bulk to entrepreneurs who want to earn an income by serving their communities. Most people in South Africa can’t pay R250 for a single item of clothing, but they can often afford around R130.
              </p>
              <p>
                We sell 35kg bales containing a variety of men’s and women’s items: jackets, pants, shirts, skirts, dresses and shorts. Clothing weights differ—jackets weigh more than T‑shirts—so the mix varies, but you can expect roughly 100 items per bale.
              </p>
              <p>
                Each bale sells for <strong>R6,500</strong>. That’s about <strong>R65 per item</strong>. Resellers commonly price pieces at around <strong>R130</strong>, which means you can realistically <strong>double your investment</strong> while keeping clothing affordable for customers.
              </p>
              <div className="mb-8">
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                  <p className="text-sm md:text-base">
                    Goal for informal traders: Sell about <strong>100 items/week</strong> (one 35kg bale) at an average of <strong>R130</strong> per item to make roughly <strong>R6,500 profit per week</strong>. Start this business for as little as <strong>R6,500</strong>.
                  </p>
                </div>
              </div>
            </div>
            <aside className="bg-card border rounded-xl p-6 h-fit">
              <h3 className="font-bold mb-4">Double your investment</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-muted-foreground">Bale weight</dt>
                <dd className="font-semibold">35kg</dd>
                <dt className="text-muted-foreground">Approx. items</dt>
                <dd className="font-semibold">~100</dd>
                <dt className="text-muted-foreground">Bale price</dt>
                <dd className="font-semibold">R6,500</dd>
                <dt className="text-muted-foreground">Avg. cost/item</dt>
                <dd className="font-semibold">~R65</dd>
                <dt className="text-muted-foreground">Sell from</dt>
                <dd className="font-semibold">~R130/item</dd>
                <dt className="text-muted-foreground">Potential ROI</dt>
                <dd className="font-semibold">≈ 2×</dd>
                <dd className="col-span-2">
                  <hr className="my-2 border-muted" />
                </dd>
                <dt className="text-muted-foreground">Your sales</dt>
                <dd className="font-semibold">R13,500!</dd>
                <dt className="text-muted-foreground">Your profit</dt>
                <dd className="font-semibold">R6,500!</dd>
              </dl>
              <Button variant="sun" className="mt-6 w-full" asChild>
                <a href="/contact">Buy a bale</a>
              </Button>
            </aside>
          </article>
        </section>

        <section id="gallery" className="bg-secondary/50 py-16">
          <div className="container mx-auto">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold">What it looks like</h2>
              <p className="text-muted-foreground">Realistic examples of bales and mixed clothing.</p>
            </header>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  src: baleImg,
                  alt: "Wrapped bales of secondhand clothing stacked on pallets",
                },
                {
                  src: flatlayImg,
                  alt: "Assorted men’s and women’s clothing laid out neatly",
                },
                {
                  src: marketImg,
                  alt: "Market table with folded clothing and R50 price cards",
                },
                {
                  src: "/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png",
                  alt: "Informal trader selling affordable clothing at a township market stall",
                },
              ].map((img) => (
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
