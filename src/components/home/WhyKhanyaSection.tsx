import { CheckCircle2, Users, Heart, Briefcase, Store } from "lucide-react";
import saFlag from "@/assets/south-africa-flag.png";

const useCases = [
  {
    icon: Users,
    title: "For your family",
    description: "Dress your kids, family, and loved ones with quality clothing at a fraction of retail prices.",
  },
  {
    icon: Briefcase,
    title: "For your staff",
    description: "Affordable workwear and uniforms for your employees. Buy in bulk and save.",
  },
  {
    icon: Heart,
    title: "For donations",
    description: "Support charities, orphanages, and communities with quality clothing that makes a real difference.",
  },
  {
    icon: Store,
    title: "For reselling",
    description: "Start or grow your clothing business. Sell individual items at R50-R100 each for 2-3× profit.",
  },
];

const WhyKhanyaSection = () => (
  <section id="why-khanya" className="container mx-auto py-16">
    <header className="mb-8">
      <h2 className="text-3xl font-extrabold">Why buy from Khanya?</h2>
      <p className="text-muted-foreground mt-2">Quality clothing for every need — at prices everyone can afford</p>
    </header>

    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {useCases.map((uc) => (
        <div key={uc.title} className="bg-card border rounded-xl p-6 flex gap-4">
          <div className="bg-accent/10 rounded-lg p-3 h-fit">
            <uc.icon className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{uc.title}</h3>
            <p className="text-muted-foreground text-sm">{uc.description}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-4 leading-relaxed text-base">
      <p>
        <strong>Quality you can trust.</strong> Every Khanya bale contains A-grade second hand clothing — carefully checked to make sure you get good quality items. Each bale has 10-100 items depending on the clothing type, all for just R600-R1,600.
      </p>
      <p>
        <strong>Something for everyone.</strong> Our bales come in different categories: men's jackets and jeans, women's dresses and tops, children's summer wear, and more. Pick the bales that suit your needs best.
      </p>
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <img src={saFlag} alt="South Africa flag" className="w-8 h-5 object-cover rounded-sm mt-0.5 flex-shrink-0" />
        <p>
          <strong>Free delivery anywhere in South Africa.</strong> We deliver your bales for free to your door, whether you're in Johannesburg, Cape Town, Durban, or a small township. No hidden costs.
        </p>
      </div>
    </div>
  </section>
);

export default WhyKhanyaSection;
