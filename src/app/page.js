import HomeClient from './HomeClient';

export const metadata = {
  title: { absolute: 'CartsVista | Premium Fashion & Lifestyle' },
  description: 'Shop premium menswear, womenswear, kidswear, and accessories at CartsVista. Discover refined design, secure checkout, and worldwide delivery options.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomeClient />;
}
