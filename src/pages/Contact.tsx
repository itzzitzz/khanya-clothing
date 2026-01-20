import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";


const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "");
    const phone = String(form.get("phone") || "");
    const email = String(form.get("email") || "");
    const note = String(form.get("note") || "");

    try {
      toast({
        title: "Sending your enquiry...",
        description: "Please wait while we process your request.",
      });

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name,
          phone,
          email,
          note,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Failed to send email');
      }

      toast({
        title: "Enquiry sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });

      formElement.reset();

    } catch (error: any) {
      console.error('Error sending enquiry:', error);
      toast({
        title: "Failed to send enquiry",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Contact Khanya | Bulk Clothing Bales Supplier South Africa</title>
        <meta name="description" content="Contact Khanya to order bulk clothing bales (10kg). Delivery or collection available. Email sales@khanya.store or WhatsApp +27 83 305 4532." />
        <link rel="canonical" href="https://khanya.store/contact" />
        <meta name="robots" content="index, follow" />
        <meta property="og:url" content="https://khanya.store/contact" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Khanya",
            "url": "https://khanya.store/contact"
          })}
        </script>
      </Helmet>

      <Header active="contact" />

      <main>
        <section className="container mx-auto py-10">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold">Contact Khanya</h1>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Fill in your details and we'll prepare pricing, availability and delivery options for your area.
            </p>
          </header>

          <section className="bg-gradient-to-br from-accent/20 via-background to-primary/5 border-2 border-primary/20 rounded-2xl p-8 mb-10 shadow-lg">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold">Online Business Only</h2>
              
              <div className="space-y-4 text-lg text-muted-foreground">
                <p className="leading-relaxed">
                  Khanya is an <span className="font-semibold text-foreground">online-only business</span>. We do not have a physical store where customers can visit or collect orders.
                </p>
                <p className="leading-relaxed">
                  All orders are dispatched from <span className="font-semibold text-foreground">Midrand, Gauteng</span> and delivered directly to your doorstep or nearest PAXI collection point.
                </p>
                <p className="leading-relaxed">
                  To place an order, simply browse our available bales online, add them to your cart, and complete the checkout process. We'll handle the rest!
                </p>
              </div>

              <div className="pt-4">
                <Button variant="hero" size="xl" asChild className="text-lg">
                  <a href="/view-order-bales">Order Now</a>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-10 items-start pb-10">
            <form onSubmit={onSubmit} className="bg-card border rounded-xl p-6 space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Your full name" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="e.g. 082 000 0000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Your Message</Label>
                <Textarea id="note" name="note" required placeholder="Tell us about your requirements, questions, or any other details..." rows={6} />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="sun" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Submit enquiry"}
                </Button>
              </div>
            </form>

            <aside className="bg-card border rounded-xl p-6 h-fit">
              <h2 className="text-xl font-bold mb-2">Prefer to message us directly?</h2>
              <p className="text-muted-foreground mb-4">You can also email or WhatsApp us using the quick buttons below.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="lg" asChild>
                  <a href="mailto:sales@khanya.store?subject=Khanya%20Bales%20Enquiry">Email sales@khanya.store</a>
                </Button>
                <Button variant="sun" size="lg" asChild>
                  <a href="https://wa.me/27833054532" target="_blank" rel="noreferrer">WhatsApp +27 83 305 4532</a>
                </Button>
              </div>
            </aside>
          </div>
        </section>
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

export default Contact;
