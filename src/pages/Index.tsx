import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/home/HeroSection";
import WhyKhanyaSection from "@/components/home/WhyKhanyaSection";
import GallerySection from "@/components/home/GallerySection";
import ResellersSection from "@/components/home/ResellersSection";
import CtaSection from "@/components/home/CtaSection";

const Index = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.3 });
  const [active, setActive] = useState<"business" | "gallery" | "contact" | "location" | undefined>(undefined);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCoords({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  useEffect(() => {
    const ids = ["why-khanya", "gallery", "contact"] as const;
    const observer = new IntersectionObserver(
      (entries) => {
        let candidate: { id: string; ratio: number } | null = null;
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).id;
            if (!candidate || e.intersectionRatio > candidate.ratio) {
              candidate = { id, ratio: e.intersectionRatio };
            }
          }
        }
        if (candidate?.id === "why-khanya") setActive("business");
        else if (candidate) setActive(candidate.id as "gallery" | "contact");
        else setActive(undefined);
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
        <title>A-Grade Second Hand Clothing Bales from R600 | Free Delivery SA | Khanya</title>
        <meta name="description" content="Buy quality A-grade second hand clothing bales from R600. For your family, staff, donations or reselling. 30-45 items per bale. Free delivery anywhere in South Africa." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="second hand clothing bales, A-grade clothing, buy clothing bales South Africa, affordable clothing, bulk clothing, donate clothing, resell clothing, free delivery" />
        <link rel="canonical" href="https://khanya.store/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="A-Grade Second Hand Clothing Bales from R600 | Khanya" />
        <meta property="og:description" content="Buy quality second hand clothing bales from R600. For your family, staff, donations or reselling. Free delivery anywhere in South Africa." />
        <meta property="og:url" content="https://khanya.store/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context":"https://schema.org",
            "@type":"Organization",
            "name":"Khanya",
            "url": "https://khanya.store",
            "logo": "/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png",
            "contactPoint":[{"@type":"ContactPoint","contactType":"sales","email":"sales@khanya.store","telephone":"+27 83 305 4532","areaServed":"ZA"}]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context":"https://schema.org",
            "@type":"WebSite",
            "name":"Khanya",
            "url": "https://khanya.store",
            "potentialAction": {
              "@type":"SearchAction",
              "target": "https://khanya.store/view-order-bales?q={search_term_string}",
              "query-input":"required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      <Header active={active} />

      <main>
        <HeroSection coords={coords} onMouseMove={handleMove} />
        <WhyKhanyaSection />
        <GallerySection />
        <ResellersSection />
        <CtaSection />
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/terms-of-service" className="hover:underline text-muted-foreground">Terms of Service</a>
            <a href="#" className="hover:underline text-muted-foreground">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
