import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";

const Reviews = () => {
  useEffect(() => {
    // Load Elfsight script
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://elfsightcdn.com/platform.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Customer Reviews | Khanya Clothing Bales</title>
        <meta
          name="description"
          content="Read what our customers say about Khanya clothing bales. Real reviews from entrepreneurs and traders across South Africa."
        />
        <meta name="keywords" content="Khanya reviews, clothing bales reviews, wholesale clothing South Africa, customer testimonials" />
        <link rel="canonical" href="https://khanya.store/reviews" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Customer Reviews | Khanya Clothing Bales" />
        <meta property="og:description" content="Read what our customers say about Khanya clothing bales. Real reviews from entrepreneurs and traders across South Africa." />
        <meta property="og:url" content="https://khanya.store/reviews" />
      </Helmet>

      <Header active="reviews" />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Customer Reviews
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              See what entrepreneurs and traders across South Africa are saying about their experience with Khanya clothing bales.
            </p>
          </div>
        </section>

        {/* Reviews Widget Section */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            <div
              className="elfsight-app-20e277ec-ee35-428d-a9a7-3916f23f9bdf"
              data-elfsight-app-lazy
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Business?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join hundreds of successful entrepreneurs who trust Khanya for quality clothing bales.
            </p>
            <a
              href="/view-order-bales"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              View & Order Bales
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Khanya. All rights reserved.</p>
            <a href="/terms-of-service" className="underline hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Reviews;
