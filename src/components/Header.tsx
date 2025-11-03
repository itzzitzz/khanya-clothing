import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

export type ActiveKey = "business" | "gallery" | "contact" | "location" | "brand" | "bales" | "track" | undefined;

const Header = ({ active }: { active?: ActiveKey }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const navItems = [
    { key: "business" as const, label: "Home", href: "/" },
    { key: "brand" as const, label: "Khanya Brand", href: "/brand" },
    { key: "bales" as const, label: "View & Order Bales", href: "/view-order-bales" },
    { key: "track" as const, label: "Track Order", href: "/track-order" },
    { key: "contact" as const, label: "Contact", href: "/contact" },
  ];

  const LinkItem = ({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "text-sm px-1 py-2 relative hover:underline",
        isActive && "after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-accent after:rounded-full"
      )}
    >
      {label}
    </a>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <nav className="container mx-auto flex items-center justify-between py-3 relative">
        <a href="/" className="flex items-center gap-3" aria-label="Khanya home">
          <img
            src="/lovable-uploads/5b6d7d92-ae7b-4906-b2ef-216c9365a312.png"
            alt="Khanya sun logo"
            className="h-12 w-auto md:h-12 lg:h-14"
            loading="eager"
          />
          <span className="font-extrabold text-xl md:text-2xl tracking-wide">Khanya</span>
        </a>
        <div className="hidden md:flex items-center gap-4">
          {navItems.map((item) => (
            <LinkItem key={item.key} href={item.href} label={item.label} isActive={active === item.key} />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </nav>
      {menuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto py-2 flex flex-col">
            {navItems.map((item) => (
              <a key={item.key} href={item.href} className={cn("px-1 py-2 hover:underline", active === item.key && "font-semibold")}
                 aria-current={active === item.key ? "page" : undefined}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
