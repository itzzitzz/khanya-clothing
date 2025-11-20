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
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/contact` : "/contact"} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Khanya",
            "url": typeof window !== "undefined" ? `${window.location.origin}/contact` : "/contact"
          })}
        </script>
      </Helmet>

      <Header active="contact" />

      <main>
        <section className="container mx-auto py-10">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold">Contact Khanya</h1>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Fill in your details and we’ll prepare pricing, availability and delivery options for your area.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-10 items-start pb-16">
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
    </div>
  );
};

export default Contact;
