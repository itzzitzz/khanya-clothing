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
    document.title = "Payment Details & Free Delivery | Khanya";
    setMeta(
      "description",
      "Khanya payment details and free delivery information. EFT payment accepted with free shipping to anywhere in South Africa on all orders."
    );
    ensureCanonical(window.location.href);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Khanya",
    description:
      "Affordable bulk secondhand clothing bales for resellers in South Africa.",
    areaServed: "South Africa",
    telephone: "+27 82 852 1112",
    email: "sales@khanya.store",
    paymentAccepted: ["BankTransfer"],
    url: typeof window !== "undefined" ? window.location.origin + "/location" : "https://khanya.example/location",
  };

  return (
    <div>
      <Header active="location" />

      <main>
        <section className="container mx-auto py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Payment Details & Delivery</h1>
          <p className="text-muted-foreground max-w-2xl">
            Simple payment process with free delivery to anywhere in South Africa.
          </p>
        </section>

        <section className="container mx-auto grid lg:grid-cols-2 gap-8 pb-16 max-w-5xl">
          <article className="bg-card border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We accept payment via <strong>EFT (Electronic Funds Transfer)</strong> only.
              </p>
              
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h3 className="font-bold mb-3">Banking Details</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Bank:</strong> First National Bank (FNB)</p>
                  <p><strong>Branch Code:</strong> 250655</p>
                  <p><strong>Account Number:</strong> 63173001256</p>
                  <p><strong>Account Name:</strong> Khanya</p>
                </div>
              </div>

              <div className="bg-primary/5 border rounded-lg p-4">
                <p className="text-sm">
                  <strong>Important:</strong> Please use your order number as the payment reference. After payment, send proof of payment to <a href="mailto:sales@khanya.store" className="text-primary hover:underline">sales@khanya.store</a>
                </p>
              </div>
            </div>
          </article>

          <article className="bg-card border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Free Delivery</h2>
            <div className="space-y-4">
              <p className="text-lg text-accent font-semibold">
                ✓ Free delivery to anywhere in South Africa
              </p>
              
              <p className="text-muted-foreground">
                All orders include free shipping, whether you're in Johannesburg, Cape Town, Durban, or any small township across South Africa. No hidden costs.
              </p>

              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h3 className="font-bold mb-2">What happens after payment?</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside text-muted-foreground">
                  <li>Send proof of payment to sales@khanya.store</li>
                  <li>We confirm your payment (usually within 24 hours)</li>
                  <li>Your bales are packed and shipped</li>
                  <li>You receive tracking information</li>
                  <li>Delivery typically takes 2-5 business days</li>
                </ol>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="hero" asChild>
                  <a href="/view-order-bales">Order Now</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/27828521112" target="_blank" rel="noreferrer">WhatsApp Us</a>
                </Button>
              </div>
            </div>
          </article>
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
