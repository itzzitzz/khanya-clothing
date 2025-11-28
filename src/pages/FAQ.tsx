import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqCategories = [
    {
      title: "About Khanya",
      faqs: [
        {
          question: "What does Khanya sell?",
          answer: "Khanya specialises in selling high-quality Grade A secondhand clothing imported from China and Taiwan. We sell clothing in bales to South African entrepreneurs and consumers for resale or personal use."
        },
        {
          question: "Can I visit your store to view the clothing?",
          answer: "No, Khanya is an online-only business. We do not have a physical store open to customers. All orders must be placed through our website and are delivered directly to you."
        },
        {
          question: "Where is Khanya based?",
          answer: "Khanya is based in Midrand, Gauteng, South Africa. However, we operate exclusively online and ship nationwide."
        }
      ]
    },
    {
      title: "Product Quality",
      faqs: [
        {
          question: "What quality are the clothes?",
          answer: "All our clothing is Grade A quality. We carefully inspect and remove any damaged, stained, or defective items from our stock before sale. However, due to the nature of secondhand clothing sold in bulk, minor wear or imperfections may occasionally slip through."
        },
        {
          question: "Are the sizes accurate?",
          answer: "Size labels and descriptions are provided as guidelines only. Due to the nature of secondhand clothing from various manufacturers, sizes may vary. We recommend allowing for some flexibility when purchasing."
        },
        {
          question: "Do you guarantee the quality of items?",
          answer: "While we take steps to ensure high quality, Khanya offers no guarantee on the exact quality, condition, or sizes of items sold. This is standard practice for bulk secondhand clothing sales. By purchasing, you acknowledge and accept these conditions."
        }
      ]
    },
    {
      title: "Ordering & Payment",
      faqs: [
        {
          question: "How do I place an order?",
          answer: "Simply browse our bales on the 'View & Order Bales' page, add the items you want to your cart, and proceed to checkout. You'll need to verify your email or phone number before completing your order."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept card payments (Visa, Mastercard, Apple Pay, Google Pay) processed securely through Paystack, EFT (bank transfer) to our FNB account, and FNB E-Wallet payments."
        },
        {
          question: "Is it safe to pay by card?",
          answer: "Yes, absolutely. Card payments are processed securely through Paystack, a PCI-DSS compliant payment gateway. Khanya never stores or has access to your full card details."
        },
        {
          question: "When do I need to pay?",
          answer: "For card payments, payment is taken immediately at checkout. For EFT or E-Wallet payments, you can place your order first and then make payment using the banking details provided. We'll process your order once payment is received."
        }
      ]
    },
    {
      title: "Delivery",
      faqs: [
        {
          question: "How much does delivery cost?",
          answer: "Delivery is completely FREE anywhere in South Africa! We offer both home delivery and PAXI collection point delivery at no additional cost."
        },
        {
          question: "What delivery options are available?",
          answer: "We offer two delivery options: 1) Home delivery directly to your address, or 2) Free delivery to any PAXI/PEP store collection point nationwide."
        },
        {
          question: "How long does delivery take?",
          answer: "Delivery times vary depending on your location and courier availability. Typically, orders are delivered within 3-7 business days. If you're in Midrand, you can expect to receive your goods either the same day or next day! You'll receive email and SMS updates on your order status."
        },
        {
          question: "Can I collect my order from your premises?",
          answer: "No, we do not allow customer collections from our premises. All orders must be delivered via courier or collected from a PAXI point."
        },
        {
          question: "How do I track my order?",
          answer: "You can track your order using the 'Track Order' page on our website. Enter your order number and email address to see the current status of your delivery."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      faqs: [
        {
          question: "Can I return items I don't want?",
          answer: "Due to the nature of secondhand clothing sales in bulk, returns are generally not accepted for change of mind or sizing issues. Please consider this before purchasing."
        },
        {
          question: "What if I receive the wrong items?",
          answer: "If you receive substantially different goods than ordered, please contact us within 7 days of delivery. Each case will be assessed individually at Khanya's discretion."
        },
        {
          question: "What happens if an item is out of stock?",
          answer: "If an item you ordered is out of stock, we'll contact you to offer suitable alternative clothing of equivalent value. If no suitable alternative is available or acceptable, we'll provide a full refund for the unavailable items."
        },
        {
          question: "How long do refunds take?",
          answer: "Refunds are processed to your original payment method within 7-14 business days."
        }
      ]
    },
    {
      title: "Privacy & Security",
      faqs: [
        {
          question: "What personal information do you collect?",
          answer: "We collect only the minimum information necessary to process your order: name, contact number, email address, and delivery address."
        },
        {
          question: "Do you share my information with others?",
          answer: "No, never. We will never share, sell, or distribute your personal information to any third parties. Your information is stored securely and used only for processing and delivering your orders."
        },
        {
          question: "How can I request my data be deleted?",
          answer: "You can request access to, correction of, or deletion of your personal information at any time by contacting us at sales@khanya.store."
        }
      ]
    },
    {
      title: "Contact & Support",
      faqs: [
        {
          question: "How do I contact Khanya?",
          answer: "You can reach us via email at sales@khanya.store or WhatsApp at +27 83 305 4532. You can also use the contact form on our Contact page."
        },
        {
          question: "What are your operating hours?",
          answer: "As an online business, you can place orders 24/7. Our customer support team responds to queries during business hours, typically within 24-48 hours."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>FAQ | Khanya - Frequently Asked Questions About Our Clothing Bales</title>
        <meta name="description" content="Find answers to common questions about Khanya's secondhand clothing bales, delivery, payment methods, returns, and more." />
        <link rel="canonical" href="https://khanya.store/faq" />
      </Helmet>
      
      <Header active="faq" />
      
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mb-8">
            Find answers to the most common questions about shopping with Khanya.
          </p>

          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <section key={categoryIndex}>
                <h2 className="text-xl font-bold mb-4 text-primary">{category.title}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-lg font-bold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Contact Us
              </Link>
              <a 
                href="https://wa.me/27833054532" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Khanya. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms-of-service" className="hover:underline text-muted-foreground">Terms of Service</Link>
            <Link to="/faq" className="hover:underline text-muted-foreground">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
