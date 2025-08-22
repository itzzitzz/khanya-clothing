import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const ensureCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const Location = () => {
  useEffect(() => {
    document.title = "Khanya Location & Payment Details | Midrand";
    setMeta(
      "description",
      "Find Khanya’s Midrand collection point, payment methods (EFT, FNB eWallet, cash), and delivery options. Arrange a pickup or request a delivery quote."
    );
    ensureCanonical(window.location.href);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Khanya",
    description:
      "Affordable bulk secondhand clothing bales for resellers in South Africa.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Adam International Kyalami Storage Units, River Rd, Kyalami Heights, Midrand, 1684",
      addressLocality: "Midrand",
      addressRegion: "Johannesburg",
      addressCountry: "ZA",
    },
    areaServed: "South Africa",
    telephone: "+27 82 852 1112",
    paymentAccepted: ["Cash", "BankTransfer", "EWallet"],
    hasMap:
      "https://maps.app.goo.gl/uUm3ij6EpubuKaqX6",
    url: typeof window !== "undefined" ? window.location.origin + "/location" : "https://khanya.example/location",
  };

  return (
    <div>
      <Header active="location" />

      <main>
        <section className="container mx-auto py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Location & Payment Details</h1>
          <p className="text-muted-foreground max-w-2xl">
            We’re available for collection by prior arrangement from our storage unit in Midrand. We also offer delivery—ask us for a quote for your area.
          </p>
        </section>

        <section className="container mx-auto grid lg:grid-cols-2 gap-10 items-start pb-16">
          <article className="space-y-4">
            <h2 className="text-2xl font-bold">Collection location (by appointment)</h2>
            <p>
              Adam International Kyalami Storage Units
              <br />River Rd, Khayalami Heights, Midrand, 1684
            </p>
            <div className="aspect-video w-full overflow-hidden rounded-xl border bg-card">
              <iframe
                title="Map to Adam International Kyalami Storage Units - Khanya Collection Point"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                src="https://www.google.com/maps?q=Adam%20International%20Kyalami%20Storage%20Units%2C%20River%20Rd%2C%20Khayalami%20Heights%2C%20Midrand%2C%201684&output=embed"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="hero" asChild>
                <a href="https://wa.me/27828521112" target="_blank" rel="noreferrer">Arrange collection</a>
              </Button>
            </div>
          </article>

          <aside className="space-y-10">
            <section id="payments" className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2">Payment methods</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>EFT</strong> (bank transfer)</li>
                <li><strong>FNB eWallet</strong></li>
                <li><strong>Cash</strong> is accepted on collect only. Deliveries need to be paid for in advance.</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Banking details are provided on invoice or on request.
              </p>
            </section>

            <section id="delivery" className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2">Delivery</h2>
              <p>
                We can deliver. Pricing depends on your location. Send us your suburb and quantity, and we’ll provide a delivery quote.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button variant="sun" asChild>
                  <a href="https://wa.me/27828521112?text=Hi%20Khanya%2C%20please%20quote%20delivery%20to%20[YOUR%20AREA]%20for%20[bales]%20bale(s)." target="_blank" rel="noreferrer">Get delivery quote</a>
                </Button>
              </div>
            </section>
          </aside>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <footer className="border-t">
        <div className="container mx-auto py-8 flex items-center justify-between text-sm">
          <p>&copy; {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <a href="/" className="hover:underline">Back to home</a>
        </div>
      </footer>
    </div>
  );
};

export default Location;
