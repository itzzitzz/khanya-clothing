import { CheckCircle2 } from "lucide-react";

const ResellersSection = () => (
  <section className="bg-primary/5 py-16">
    <div className="container mx-auto">
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold mb-3">For resellers: grow your business</h2>
        <p className="text-muted-foreground">If you're reselling, here's how Khanya helps you earn more.</p>
      </header>

      <div className="mb-8">
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 max-w-4xl mx-auto">
          <p className="text-sm md:text-base text-center">
            <strong>Realistic weekly goal:</strong> Sell one bale per week at an average of <strong>R70-R80</strong> per item. That's great profit every week depending on bale size.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
        <div className="bg-card border rounded-lg p-4">
          <div className="font-bold text-lg mb-2">1. Start Small</div>
          <p className="text-muted-foreground text-sm">Order your first bale for R600-R1,600. Test your market and learn what sells best.</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="font-bold text-lg mb-2">2. Build Momentum</div>
          <p className="text-muted-foreground text-sm">Reinvest your profits. Order weekly. Build relationships with regular customers.</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="font-bold text-lg mb-2">3. Grow</div>
          <p className="text-muted-foreground text-sm">Scale up to multiple bales per week. Open a stall. Create jobs in your community.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-accent h-6 w-6" />
            <h3 className="font-bold text-lg">Quick Reorder Reward</h3>
          </div>
          <p className="text-muted-foreground mb-4">Place a second order within 1 week of your previous order to receive:</p>
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <p className="font-semibold text-accent">10 free coat-hangers</p>
            <p className="text-sm text-muted-foreground mt-1">Perfect for displaying your clothing professionally</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-accent h-6 w-6" />
            <h3 className="font-bold text-lg">Brand Builder Package</h3>
          </div>
          <p className="text-muted-foreground mb-4">Order 8 bales in a month to receive your choice of:</p>
          <div className="space-y-2">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
              <p className="font-semibold text-accent">8 free Khanya branded caps</p>
            </div>
            <div className="text-center text-sm text-muted-foreground">OR</div>
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
              <p className="font-semibold text-accent">8 free Khanya branded t-shirts</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">Use yourself or give to your favourite customers!</p>
        </div>
      </div>
    </div>
  </section>
);

export default ResellersSection;
