import baleImg from "@/assets/clothing-display.jpg";
import flatlayImg from "@/assets/mixed-clothing-flatlay.jpg";
import basketsImg from "@/assets/clothing-baskets.jpg";
import marketDisplayImg from "@/assets/market-display.jpg";

const images = [
  { src: baleImg, alt: "Two people proudly displaying quality clothing from a Khanya bale" },
  { src: flatlayImg, alt: "Assorted men's, women's and children's clothing laid out neatly" },
  { src: "/lovable-uploads/bale-with-packing-list.jpg", alt: "Compressed clothing bale with Khanya packing list showing order details" },
  { src: basketsImg, alt: "Colourful assorted clothing displayed in baskets" },
  { src: marketDisplayImg, alt: "Colourful t-shirts hanging on display at an outdoor market" },
  { src: "/lovable-uploads/2c9af322-a6d3-4b2a-8692-a7f8bddb0726.png", alt: "Affordable clothing at a township market stall" },
];

const GallerySection = () => (
  <section id="gallery" className="bg-secondary/50 py-16">
    <div className="container mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold">What you get</h2>
        <p className="text-muted-foreground">See real examples of our bales and clothing.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-6">
        {images.map((img) => (
          <figure key={img.alt} className="group overflow-hidden rounded-xl border bg-card">
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default GallerySection;
