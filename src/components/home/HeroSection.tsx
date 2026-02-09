import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/bale-hero.png";
import saFlag from "@/assets/south-africa-flag.png";

interface HeroSectionProps {
  coords: { x: number; y: number };
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
}

const HeroSection = ({ coords, onMouseMove }: HeroSectionProps) => (
  <section
    onMouseMove={onMouseMove}
    style={{
      backgroundImage: "var(--gradient-hero)",
      ["--cursor-x" as string]: `${Math.round(coords.x * 100)}%`,
      ["--cursor-y" as string]: `${Math.round(coords.y * 100)}%`,
    } as React.CSSProperties}
    className="relative overflow-hidden"
  >
    <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center py-16">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <img
            src="/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
            alt="Khanya sun logo"
            className="h-24 md:h-32 w-auto"
            loading="lazy"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur border-2 border-primary/20 rounded-full">
            <img src={saFlag} alt="South Africa flag" className="w-6 h-4 object-cover rounded-sm" />
            <span className="text-sm font-semibold text-muted-foreground leading-none">South Africa</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          A-Grade Second Hand Clothing Bales
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-xl">
          Khanya sells quality second hand clothing bales from as little as R600. Whether you're buying for your family, your staff, to donate to charities and orphanages, or to resell — we've got you covered with free delivery anywhere in South Africa.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="hero" size="xl" asChild>
            <a href="/view-order-bales">View & order bales</a>
          </Button>
          <Button variant="sun" size="xl" asChild>
            <a href="#why-khanya">Why Khanya?</a>
          </Button>
        </div>
        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {["Bales from R600", "A-grade quality", "Free delivery nationwide", "10-100 items per bale"].map((t) => (
            <li className="flex items-start gap-2" key={t}>
              <CheckCircle2 className="text-accent" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        <img
          src={heroImg}
          alt="Compressed plastic-wrapped clothing bales showing mixed second-hand garments"
          className="w-full aspect-[4/3] rounded-xl shadow-[var(--shadow-elegant)] object-cover"
          loading="eager"
        />
      </div>
    </div>
  </section>
);

export default HeroSection;
