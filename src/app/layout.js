import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { PromoProvider } from "@/context/PromoContext";
import { BlogProvider } from "@/context/BlogContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import CustomAlert from "@/components/CustomAlert";
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
  title: "CartsVista - Sublime Artistic Explorations",
  description: "Experience premium fashion and uncompromising craftsmanship.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
    >
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
