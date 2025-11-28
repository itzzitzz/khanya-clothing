import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Terms of Service | Khanya - Online Clothing Sales</title>
        <meta name="description" content="Terms of Service for Khanya online clothing store. Read our policies on purchases, delivery, returns, privacy and more." />
        <link rel="canonical" href="https://khanya.store/terms-of-service" />
      </Helmet>
      
      <Header />
      
      <main className="flex-1 container mx-auto py-12 px-4">
        <article className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">1. Business Information</h2>
            <p className="text-muted-foreground mb-4">
              Khanya is an online-only business registered and operating in South Africa. Our registered business address is:
            </p>
            <address className="not-italic bg-muted/50 p-4 rounded-lg mb-4">
              <strong>Khanya</strong><br />
              25 Kyalami Villas<br />
              Jubie Road<br />
              Barbeque Downs<br />
              Midrand<br />
              South Africa
            </address>
            <p className="text-muted-foreground">
              <strong>Important:</strong> This address is for registration purposes only. Khanya operates exclusively online and does not permit customer visits or collections from this address. All orders are delivered to customers via courier or PAXI collection points.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">2. Nature of Business</h2>
            <p className="text-muted-foreground mb-4">
              Khanya specialises in the sale of secondhand clothing imported from China and Taiwan. Our clothing is sourced in bales and sold to South African entrepreneurs and consumers for resale or personal use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">3. Product Quality</h2>
            <p className="text-muted-foreground mb-4">
              All clothing sold by Khanya is Grade A quality. We take reasonable steps to inspect and remove any damaged, stained, or defective items from our stock before sale. However, due to the nature of secondhand clothing sold in bulk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Minor damage, wear, or stains may occasionally be present in items</li>
              <li>Khanya offers <strong>no guarantee</strong> on the quality, condition, or sizes of items sold</li>
              <li>Size labels and descriptions are provided as guidelines only and may not be accurate</li>
              <li>The quantity and types of items in each bale may vary</li>
            </ul>
            <p className="text-muted-foreground">
              By placing an order, you acknowledge and accept these conditions inherent to secondhand clothing sales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">4. Pricing and Payment</h2>
            <p className="text-muted-foreground mb-4">
              All prices displayed on our website are in South African Rand (ZAR) and include VAT where applicable. We accept the following payment methods:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li><strong>Card payments:</strong> Visa, Mastercard, Apple Pay, and Google Pay processed securely by Paystack</li>
              <li><strong>EFT (Electronic Funds Transfer):</strong> Direct bank transfer to our FNB account</li>
              <li><strong>FNB E-Wallet:</strong> Mobile payment option</li>
            </ul>
            <p className="text-muted-foreground">
              Card payments are processed securely through Paystack, a PCI-DSS compliant payment gateway. Khanya does not store or have access to your full card details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">5. Orders and Delivery</h2>
            <p className="text-muted-foreground mb-4">
              Upon placing an order, you will receive an order confirmation via email. Delivery is provided free of charge anywhere in South Africa through:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li><strong>Home delivery:</strong> Directly to your specified address</li>
              <li><strong>PAXI collection:</strong> To any PAXI/PEP store collection point nationwide</li>
            </ul>
            <p className="text-muted-foreground">
              Delivery times may vary depending on your location and courier availability. You will receive updates on your order status via email and SMS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">6. Stock Availability</h2>
            <p className="text-muted-foreground mb-4">
              In the event that an item or bale you have ordered is out of stock or unavailable:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>We will contact you to offer suitable alternative clothing of equivalent value</li>
              <li>If no suitable alternative is available or acceptable, we will provide a full refund for the unavailable items</li>
              <li>Refunds will be processed to the original payment method within 7-14 business days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">7. Returns and Refunds</h2>
            <p className="text-muted-foreground mb-4">
              Due to the nature of secondhand clothing sales in bulk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Returns are generally not accepted for change of mind or sizing issues</li>
              <li>If you receive substantially different goods than ordered, please contact us within 7 days of delivery</li>
              <li>Each case will be assessed individually and at Khanya's discretion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">8. Privacy and Data Protection (POPIA Compliance)</h2>
            <p className="text-muted-foreground mb-4">
              In accordance with the Protection of Personal Information Act (POPIA), Khanya is committed to protecting your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>We collect only the minimum personal information necessary to process your order, communicate with you, and deliver your goods</li>
              <li>Information collected includes: name, contact number, email address, and delivery address</li>
              <li>Your personal information is stored securely and is protected against unauthorised access</li>
              <li><strong>We will never share, sell, or distribute your personal information to any third parties</strong></li>
              <li>Payment information is processed securely by Paystack and is not stored by Khanya</li>
            </ul>
            <p className="text-muted-foreground">
              You have the right to request access to, correction of, or deletion of your personal information at any time by contacting us at sales@khanya.store.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">9. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on this website, including text, images, logos, and design, is the property of Khanya and is protected by South African intellectual property laws. You may not reproduce, distribute, or use any content without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Khanya shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products. Our liability is limited to the purchase price of the goods ordered.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms of Service are governed by the laws of the Republic of South Africa. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the South African courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              Khanya reserves the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after any changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Email:</strong> sales@khanya.store</li>
              <li><strong>WhatsApp:</strong> +27 83 305 4532</li>
            </ul>
          </section>
        </article>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms-of-service" className="hover:underline text-muted-foreground">Terms of Service</Link>
            <a href="#" className="hover:underline text-muted-foreground">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
