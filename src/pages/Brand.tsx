import { useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";


const Brand = () => {
  useEffect(() => {
    const title = "Khanya Brand – Clothing That Shines";
    document.title = title;

    const metaName = "description";
    const description =
      "Khanya is an African-inspired clothing brand that radiates light, pride, and possibility. Wear bold designs that uplift communities.";
    let meta = document.querySelector(`meta[name="${metaName}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", metaName);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = typeof window !== "undefined" ? `${window.location.origin}/brand` : "/brand";
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalHref);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Brand",
      name: "Khanya",
      slogan: "Clothing That Shines From the Inside Out",
      description:
        "Khanya blends African patterns and modern comfort to celebrate pride, resilience, and possibility. Wear light. Shine from within.",
      url: typeof window !== "undefined" ? window.location.origin : "https://khanya.example",
      logo: `${typeof window !== "undefined" ? window.location.origin : ""}/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png`,
    } as const;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <Header active="brand" />
      <main>
        <article className="container mx-auto py-10 md:py-14">
            <header className="mb-8 md:mb-10">
              <div className="mb-4">
                <img
                  src="/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
                  alt="Khanya sun logo"
                  className="h-24 md:h-32 w-auto"
                  loading="lazy"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Khanya: Clothing That Shines From the Inside Out
              </h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">
              In the heart of Africa, where stories are told in color, rhythm, and spirit, there’s a word that carries both light and life: Khanya. In Zulu and Xhosa, Khanya means “shine,” “radiate light,” or “be bright.” It’s not just about the glow you see — it’s about the glow you feel.
            </p>
          </header>

          <section className="grid gap-8 md:gap-10 md:grid-cols-2 items-start">
            <div className="rounded-lg overflow-hidden border bg-card">
              <img
                src="/lovable-uploads/30d2102c-d664-4ad3-9cbb-0f88e0856966.png"
                alt="Middle-aged Black woman walking down a dirt road in a rural township at winter sunrise, wearing a yellow Khanya puffer jacket with logo on the breast pocket"
                className="w-full h-64 md:h-[420px] object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">We also have branded Khanya clothing for sale!</h2>
                <p className="mt-2 text-muted-foreground">
                  More Than Fashion — It’s a Statement.
                </p>
                <p className="mt-2 text-muted-foreground">
                  When you wear Khanya, you’re not just wearing clothes. You’re wearing light. You’re telling the world that you believe in your own potential, in your roots, and in a future that is brighter than the past.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Our designs are bold because our people are bold. They blend African patterns and colours with modern, comfortable cuts — made to move with you, whether you’re in the township, the city, or anywhere in between.
                </p>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold">Who Wears Khanya?</h2>
                <p className="mt-2 text-muted-foreground">Khanya is for the everyday hero.</p>
                <p className="text-muted-foreground">The mother who rises before dawn to make sure her children are fed and ready for school.</p>
                <p className="text-muted-foreground">The young entrepreneur hustling to turn ideas into income.</p>
                <p className="text-muted-foreground">The student walking to class, head high, dreams even higher.</p>
                <p className="text-muted-foreground">The artist, the worker, the leader — anyone who believes they can be a light in their community.</p>
                <p className="text-muted-foreground">Khanya wearers are proud of where they come from and confident in where they’re going. They don’t wait for the world to hand them a spotlight — they bring their own.</p>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold">Pride in Every Thread</h2>
                <p className="mt-2 text-muted-foreground">We believe fashion should uplift, not exploit. That’s why Khanya is committed to working with local entrepreneurs whenever possible, keeping skills and income within our communities. Every purchase is more than just clothing — it’s an investment in African talent, creativity, and entrepreneurship.</p>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold">Wearing Khanya Means…</h2>
                <p className="mt-2 text-muted-foreground">Walking tall, no matter your background.</p>
                <p className="text-muted-foreground">Knowing your culture is your crown.</p>
                <p className="text-muted-foreground">Believing that light is more powerful than darkness.</p>
              </div>

              <div>
                <p className="text-muted-foreground">In a world that often tries to dim us down, Khanya is here to remind you: You were made to shine.</p>
                <p className="text-muted-foreground">So wear Khanya proudly.</p>
                <p className="text-muted-foreground">Not because it’s just a brand — but because it’s you.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button asChild variant="hero">
                  <a href="/#business" aria-label="Learn how Khanya works">How it works</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/location" aria-label="Find our location and payment options">Location & Payments</a>
                </Button>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
};

export default Brand;
