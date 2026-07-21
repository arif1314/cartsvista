import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { PromoProvider } from "@/context/PromoContext";
import { BlogProvider } from "@/context/BlogContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import CustomAlert from "@/components/CustomAlert";
import { SITE_URL, absoluteUrl } from "@/lib/site/url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CartsVista | Premium Fashion & Lifestyle",
    template: "%s | CartsVista",
  },
  description: "Shop premium menswear, womenswear, kidswear, and accessories at CartsVista. Discover refined design, secure checkout, and worldwide delivery options.",
  applicationName: "CartsVista",
  keywords: ["CartsVista", "premium fashion", "menswear", "womenswear", "kidswear", "fashion accessories"],
  authors: [{ name: "CartsVista", url: SITE_URL }],
  creator: "CartsVista",
  publisher: "CartsVista",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "CartsVista",
    title: "CartsVista | Premium Fashion & Lifestyle",
    description: "Premium fashion and lifestyle collections crafted with uncompromising elegance.",
    images: [{ url: "/promos/promo3-modern-tailoring.webp", width: 1200, height: 630, alt: "CartsVista premium fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CartsVista | Premium Fashion & Lifestyle",
    description: "Premium fashion and lifestyle collections crafted with uncompromising elegance.",
    images: ["/promos/promo3-modern-tailoring.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "CartsVista",
    alternateName: ["Carts Vista", "CartsVista Online Store"],
    description: "Premium fashion and lifestyle ecommerce store.",
    inLanguage: "en-US",
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "CartsVista",
    url: SITE_URL,
    logo: absoluteUrl("/icon.png"),
    email: "support@cartsvista.com",
    telephone: "+1-505-884-3682",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1209 Mountain Road Pl NE Ste R",
      addressLocality: "Albuquerque",
      addressRegion: "NM",
      postalCode: "87110",
      addressCountry: "US",
    },
    sameAs: ["https://www.facebook.com/CartsVista"],
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteSchema, organizationSchema]).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <CategoryProvider>
          <PromoProvider>
            <BlogProvider>
              <WishlistProvider>
                <CartProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <CustomAlert />
                </CartProvider>
              </WishlistProvider>
            </BlogProvider>
          </PromoProvider>
        </CategoryProvider>
      </body>
    </html>
  );
}
