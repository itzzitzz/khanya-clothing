import { Button } from "@/components/ui/button";
import saFlag from "@/assets/south-africa-flag.png";

const CtaSection = () => (
  <section id="contact" className="container mx-auto py-16">
    <div className="bg-card border rounded-2xl p-8 md:p-12 text-center shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-center gap-2 mb-3">
        <img src={saFlag} alt="South Africa flag" className="w-8 h-5 object-cover rounded-sm" />
        <h2 className="text-3xl font-extrabold">Ready to order?</h2>
      </div>
      <p className="text-muted-foreground mb-6">Browse our bales and find the perfect clothing for your needs — from R600 with free delivery.</p>
      <div className="flex justify-center">
        <Button variant="hero" size="xl" asChild>
          <a href="/view-order-bales">View & order bales</a>
        </Button>
      </div>
    </div>
  </section>
);

export default CtaSection;
