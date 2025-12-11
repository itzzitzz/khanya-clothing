import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import saFlag from "@/assets/south-africa-flag.png";
import marketImg from "@/assets/outdoor-market.png";
import baleImg from "@/assets/clothing-display.jpg";
import basketsImg from "@/assets/clothing-baskets.jpg";

const Blog = () => {
  return (
    <div>
      <Helmet>
        <title>How to Start Selling Clothes in South Africa | Easy Guide | Khanya</title>
        <meta name="description" content="Learn how to start selling second hand clothes in South Africa. Easy step by step guide for beginners. Start your clothing business with R1,000. Free delivery." />
        <meta name="keywords" content="how to start selling clothes South Africa, sell second hand clothes, start clothing business township, informal trader clothes, make money selling clothes, buy clothing bales, wholesale clothes South Africa, resell clothes for profit, township business ideas, spaza shop clothes" />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/blog` : "/blog"} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="How to Start Selling Clothes in South Africa | Easy Guide" />
        <meta property="og:description" content="Learn how to start selling second hand clothes. Easy guide for beginners. Start with R1,000 and make R3,000+ profit." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Start Selling Clothes in South Africa - Easy Guide for Beginners",
            "description": "Learn how to start your own clothing business selling second hand clothes. Simple step by step guide for South African entrepreneurs.",
            "author": {
              "@type": "Organization",
              "name": "Khanya"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Khanya",
              "logo": {
                "@type": "ImageObject",
                "url": "/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
              }
            },
            "datePublished": "2025-12-11",
            "dateModified": "2025-12-11"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Start Selling Second Hand Clothes in South Africa",
            "description": "Easy step by step guide to start your clothing business",
            "step": [
              {
                "@type": "HowToStep",
                "name": "Get Your First Bale",
                "text": "Order a clothing bale from Khanya for R1,000 to R1,600"
              },
              {
                "@type": "HowToStep",
                "name": "Find Your Selling Spot",
                "text": "Set up at markets, taxi ranks, or sell to neighbors"
              },
              {
                "@type": "HowToStep",
                "name": "Price Your Clothes",
                "text": "Sell each item for R50 to R100"
              },
              {
                "@type": "HowToStep",
                "name": "Make Profit and Grow",
                "text": "Use your profit to buy more bales and grow your business"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <Header active="blog" />

      <main className="pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <img src={saFlag} alt="South Africa flag" className="w-8 h-5 object-cover rounded-sm" />
              <span className="text-sm font-medium text-muted-foreground">South Africa Business Guide</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 max-w-3xl">
              How to Start Selling Clothes in South Africa
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              A simple guide to help you start your own clothing business. No big money needed. No experience needed. Just follow these easy steps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <a href="/view-order-bales">See Clothing Bales</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/contact">Ask Us Questions</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <article className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">You Can Start a Clothing Business Today</h2>
              <p className="text-lg leading-relaxed mb-4">
                Do you want to <strong>make money selling clothes</strong>? Good news! You don't need a lot of money to start. You don't need a shop. You don't need experience. Many people in South Africa are making good money selling second hand clothes.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                At Khanya, we help people like you start their own <strong>clothing business</strong>. We sell <strong>clothing bales</strong> - big bags full of clothes. You buy one bale, then sell each piece of clothing one by one. This is how you make profit!
              </p>
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 my-6">
                <p className="text-lg font-semibold text-accent">
                  💡 Start with just R1,000 and make R2,000 to R3,000 profit!
                </p>
              </div>
            </section>

            <figure className="my-10">
              <img 
                src={marketImg} 
                alt="People selling clothes at outdoor market in South Africa township" 
                className="w-full rounded-xl shadow-lg"
                loading="lazy"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Many South Africans sell clothes at markets and make good money
              </figcaption>
            </figure>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">What is a Clothing Bale?</h2>
              <p className="text-lg leading-relaxed mb-4">
                A <strong>clothing bale</strong> is a big bag wrapped in plastic. Inside are many pieces of clothes - maybe 30, 40, or 45 items. The clothes are <strong>second hand</strong> (used before) but still in good condition.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We get our clothes from China and Taiwan. These are quality clothes that people wore before. We check them and put them in bales for you to sell.
              </p>
              <ul className="space-y-3 my-6">
                {[
                  "Men's clothes: t-shirts, jeans, jackets",
                  "Women's clothes: dresses, tops, jackets",
                  "Children's clothes: summer wear, winter wear",
                  "Mixed bales: all types together"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent h-5 w-5 mt-1 flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">How to Start - 4 Easy Steps</h2>
              
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                    <h3 className="text-xl font-bold">Get Your First Bale</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Go to our website and pick a bale. Prices are R1,000 to R1,600. Choose what you want to sell - men's clothes, women's clothes, or children's clothes. We deliver FREE anywhere in South Africa!
                  </p>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                    <h3 className="text-xl font-bold">Find Your Selling Spot</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Where will you sell? You can sell at <strong>markets</strong>, <strong>taxi ranks</strong>, on the <strong>street corner</strong>, or even to your <strong>neighbors</strong>. You don't need a shop! Many successful sellers started selling outside their house.
                  </p>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
                    <h3 className="text-xl font-bold">Price Your Clothes</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Sell each item for <strong>R50 to R100</strong>. Nice jackets can sell for R100 or more. T-shirts sell for R50-R70. You decide the price. The people in your area will tell you what they can pay.
                  </p>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
                    <h3 className="text-xl font-bold">Make Profit and Grow</h3>
                  </div>
                  <p className="text-muted-foreground">
                    After you sell your first bale, use that money to buy more bales. The more you sell, the more you make. Many of our sellers now buy 2, 3, or even 8 bales every month!
                  </p>
                </div>
              </div>
            </section>

            <figure className="my-10">
              <img 
                src={baleImg} 
                alt="Two happy clothing sellers showing clothes from their bale" 
                className="w-full rounded-xl shadow-lg"
                loading="lazy"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Happy sellers with their quality clothes
              </figcaption>
            </figure>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How Much Money Can You Make?</h2>
              <p className="text-lg leading-relaxed mb-4">
                Let's do the maths together. This is very important!
              </p>
              
              <div className="bg-secondary/50 rounded-xl p-6 my-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>You buy a bale for:</span>
                  <span className="font-bold">R1,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>The bale has:</span>
                  <span className="font-bold">35 pieces of clothes</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>You sell each piece for:</span>
                  <span className="font-bold">R70 (average)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span>Total you make from sales:</span>
                  <span className="font-bold">R2,450</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-accent/20 rounded-lg px-3">
                  <span className="font-bold">Your profit:</span>
                  <span className="font-bold text-accent text-xl">R1,450!</span>
                </div>
              </div>

              <p className="text-lg leading-relaxed">
                That's more than double your money! And if you sell one bale every week, you can make <strong>R5,000 to R6,000 profit every month</strong>. That's good money to help your family.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Sell Second Hand Clothes?</h2>
              <ul className="space-y-4">
                {[
                  { title: "People want affordable clothes", desc: "Not everyone can buy new clothes from the mall. Many people prefer second hand because it's cheaper." },
                  { title: "Good quality for less money", desc: "Second hand clothes from overseas are often better quality than cheap new clothes." },
                  { title: "You help the environment", desc: "When you sell second hand clothes, you help reduce waste. Good for the earth!" },
                  { title: "Low risk business", desc: "You start small. If it doesn't work, you only lose a little. But it usually works!" },
                  { title: "Be your own boss", desc: "No boss telling you what to do. You decide when to work and how much to sell." }
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent h-5 w-5 mt-1 flex-shrink-0" />
                    <div>
                      <strong>{item.title}</strong>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <figure className="my-10">
              <img 
                src={basketsImg} 
                alt="Colorful clothes in baskets ready for sale at market" 
                className="w-full rounded-xl shadow-lg"
                loading="lazy"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Display your clothes nicely to attract customers
              </figcaption>
            </figure>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Tips to Sell More Clothes</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-bold mb-1">Keep your clothes clean and neat</h3>
                  <p className="text-muted-foreground">People like to buy from sellers who display clothes nicely. Use hangers if you can.</p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-bold mb-1">Know your customers</h3>
                  <p className="text-muted-foreground">What do people in your area like? Young people want trendy clothes. Parents want clothes for kids. Sell what your customers want.</p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-bold mb-1">Be friendly</h3>
                  <p className="text-muted-foreground">Smile! Greet people! Happy customers come back and tell their friends about you.</p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-bold mb-1">Sell at the right time</h3>
                  <p className="text-muted-foreground">Pay day is the best time to sell. Weekends are also good when people are not at work.</p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-bold mb-1">Start with one type of clothes</h3>
                  <p className="text-muted-foreground">If you're new, start with one type - like women's clothes or children's clothes. Learn what sells before trying everything.</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Buy From Khanya?</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Free Delivery", desc: "We deliver anywhere in South Africa for free. Johannesburg, Cape Town, Durban, townships - everywhere!" },
                  { title: "Low Prices", desc: "Our bales start at R1,000. You don't need a lot of money to start." },
                  { title: "Good Quality", desc: "We check all clothes before we sell. You get good quality items." },
                  { title: "Easy to Order", desc: "Order on our website. Pay by card, EFT, or E-Wallet. We send your bale fast." }
                ].map((item) => (
                  <div key={item.title} className="bg-card border rounded-lg p-4">
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Questions People Ask</h2>
              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Do I need to register a business?</h3>
                  <p className="text-muted-foreground">No! You can start selling today. Many informal traders don't have registered businesses. Start small first.</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2">What if some clothes don't sell?</h3>
                  <p className="text-muted-foreground">Lower the price a little. Or try selling in a different place. Most clothes will sell eventually.</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2">How long does delivery take?</h3>
                  <p className="text-muted-foreground">Usually 3-7 days. If you live in Midrand, you can get same-day or next-day delivery!</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Can I pay cash?</h3>
                  <p className="text-muted-foreground">We accept card payments, EFT (bank transfer), and FNB E-Wallet. No cash at the moment.</p>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary/10 rounded-2xl p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Business?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Don't wait! Many people like you are already making money selling clothes. Start with just R1,000 and see how your life can change.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/view-order-bales" className="flex items-center gap-2">
                    See Our Bales <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/contact">Contact Us</a>
                </Button>
              </div>
            </section>

          </div>
        </article>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/terms-of-service" className="hover:underline text-muted-foreground">Terms of Service</a>
            <a href="/faq" className="hover:underline text-muted-foreground">FAQ</a>
            <a href="/" className="hover:underline text-muted-foreground">Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
