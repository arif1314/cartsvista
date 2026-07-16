-- ============================================================
-- CartsVista Database Migration v2
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Existing tables-এ নতুন columns যোগ করা
-- ============================================================

-- profiles table-এ role যোগ করা
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'staff', 'customer'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- products table-এ নতুন columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
    ALTER TABLE products ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
    ALTER TABLE products ADD COLUMN slug text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
    ALTER TABLE products ADD COLUMN brand text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tags') THEN
    ALTER TABLE products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='updated_at') THEN
    ALTER TABLE products ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- orders table-এ নতুন columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_cost') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost numeric DEFAULT 150;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- STEP 2: নতুন টেবিল তৈরি
-- ============================================================

-- Categories (localStorage থেকে DB-তে)
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  collections text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Articles/Blog (localStorage থেকে DB-তে)
CREATE TABLE IF NOT EXISTS articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  content text,
  cover_image text,
  reading_time text DEFAULT '4 min read',
  related_link text,
  is_published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Banners/Promos (localStorage থেকে DB-তে)
CREATE TABLE IF NOT EXISTS banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slot text NOT NULL,  -- 'hero_slide', 'promo2', 'promo3', 'promo4', 'lookbook'
  title text,
  subtitle text,
  image_url text,
  button_text text,
  link text,
  badge text,
  percentage text,
  tag text,
  fabric text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support Tickets (tickets.json থেকে DB-তে)
CREATE TABLE IF NOT EXISTS support_tickets (
  id text PRIMARY KEY DEFAULT 'TCK-' || upper(substring(gen_random_uuid()::text, 1, 5)),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'Open' CHECK (status IN ('Open', 'Replied', 'Closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id text REFERENCES support_tickets(id) ON DELETE CASCADE,
  author text NOT NULL,  -- 'Admin' বা customer user_id
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  title text,
  body text,
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Addresses (profiles.shipping_address থেকে proper table-এ)
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label text DEFAULT 'Home',
  full_name text,
  phone text,
  address text,
  apartment text,
  city text,
  postal_code text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Site Settings (admin panel থেকে control করার জন্য)
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 3: Default data insert করা
-- ============================================================

-- Default categories (যদি আগে থেকে না থাকে)
INSERT INTO categories (slug, title, collections, sort_order) VALUES
  ('men', 'Menswear', ARRAY['Panjabi', 'Thobe & Jubba', 'Koti & Waistcoat', 'Footwear'], 1),
  ('women', 'Womenswear', ARRAY['Abaya & Burkha', 'Premium Hijab', 'Salwar Kameez', 'Jewelry'], 2),
  ('kids', 'Kids Collection', ARRAY['Boys Panjabi', 'Girls Dress', 'Newborn'], 3),
  ('accessories', 'Accessories', ARRAY['Perfume & Attar', 'Premium Caps', 'Tasbih'], 4)
ON CONFLICT (slug) DO NOTHING;

-- Default site settings
INSERT INTO site_settings (key, value) VALUES
  ('shipping_cost', '150'),
  ('currency', '"BDT"'),
  ('contact_email', '"support@cartsvista.com"'),
  ('contact_phone', '"+880 1711-000000"'),
  ('site_name', '"CartsVista"'),
  ('maintenance_mode', 'false'),
  ('free_shipping_threshold', '5000'),
  ('usd_rate', '110')
ON CONFLICT (key) DO NOTHING;

-- Default hero slides (banners)
INSERT INTO banners (slot, title, subtitle, image_url, button_text, link, sort_order) VALUES
  ('hero_slide', 'SUMMER' || chr(10) || 'EDITION 2026', 'CartsVista Exclusives', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop', 'Explore Collection', '/c/men', 1),
  ('hero_slide', 'NEW BEACHWEAR' || chr(10) || 'AUTUMN 2026', 'Upcoming Styles', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070', 'Shop Collection', '/c/men', 2),
  ('promo2', 'FLASH SALE', 'MID-SUMMER', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', null, '/c/women', 0),
  ('promo3', 'ARTFUL LIVING', 'SAVE IN STYLE', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto=format&fit=crop', null, '/c/accessories', 0),
  ('promo4', 'Beat the Heat!', null, 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop', null, '/c/accessories', 0),
  ('lookbook', 'The Festive Elegance', 'Traditional Heritage', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780', null, '/c/men', 1),
  ('lookbook', 'Modest Chic', 'Contemporary Grace', 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886', null, '/c/women', 2),
  ('lookbook', 'Minimalist Casuals', 'Effortless Comfort', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071', null, '/c/men', 3)
ON CONFLICT DO NOTHING;

-- Default articles
INSERT INTO articles (title, slug, summary, cover_image, reading_time, related_link, content) VALUES
  (
    'How to Style a Pastel Thobe for Summer Occasions',
    'style-pastel-thobe-summer',
    'Discover the art of styling pastel-colored thobes with minimal accessories, premium footwear, and breathable fabrics for ultimate summer comfort.',
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780',
    '4 min read',
    '/c/men',
    '<p>Summer in South Asia calls for clothing that is both breathable and dignified. As temperatures rise, the Thobe remains a timeless option for men.</p><h3>1. Why Pastels Work for Summer</h3><p>Dark colors absorb heat, whereas pastel tones reflect sunlight and keep you cooler.</p>'
  ),
  (
    'The Essential Guide to Choosing Premium Abaya Fabrics',
    'premium-abaya-fabric-guide',
    'From lightweight Crepe to luxurious Nidha fabric, explore the drape, breathability, and aesthetic of different fabrics to choose your perfect daily abaya.',
    'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886',
    '5 min read',
    '/c/women',
    '<p>An Abaya is more than just an outer garment; it is an expression of grace and modest elegance.</p><h3>1. Luxurious Nidha Fabric</h3><p>Nidha is widely considered the king of abaya fabrics.</p>'
  ),
  (
    'Scent Profiles: The Royal Oud and Rose Combination',
    'royal-oud-rose-scent-profile',
    'Discover the deep history, formulation, and sublime elegance of combining rich Cambodian Oud with premium Turkish Rose.',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904',
    '6 min read',
    '/c/accessories',
    '<p>The combination of Oud and Rose is one of the most celebrated and luxurious scent profiles in the history of perfumery.</p>'
  ),
  (
    'Minimalist Modest Wear: How to Curate a Capsule Wardrobe',
    'minimalist-modest-wear-capsule-wardrobe',
    'Learn how to build a highly versatile and elegant modest capsule wardrobe with just 10 high-quality, interchangeable heritage pieces.',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop',
    '5 min read',
    '/c/women',
    '<p>Building a capsule wardrobe is an excellent way to practice sustainable fashion while ensuring you always look elegant.</p>'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STEP 4: Row Level Security (RLS) সেটআপ
-- ============================================================

-- RLS enable করা
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Categories: সবাই পড়তে পারবে, admin-ই শুধু লিখতে পারবে
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin') OR 
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Articles: published articles সবাই পড়তে পারবে
CREATE POLICY "Public read published articles" ON articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admin manage articles" ON articles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Banners: সবাই পড়তে পারবে
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Admin manage banners" ON banners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Support Tickets: নিজেরটা পড়তে পারবে, admin সব পড়তে পারবে
CREATE POLICY "User read own tickets" ON support_tickets FOR SELECT
  USING (user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "User create tickets" ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage tickets" ON support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Ticket Replies
CREATE POLICY "Read ticket replies" ON ticket_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM support_tickets st 
    WHERE st.id = ticket_id AND (
      st.user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
  ));
CREATE POLICY "Create ticket replies" ON ticket_replies FOR INSERT
  WITH CHECK (true);

-- Reviews: published reviews সবাই পড়তে পারবে
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY "User create review" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage reviews" ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- User Addresses: শুধু নিজেরটা
CREATE POLICY "User manage own addresses" ON user_addresses FOR ALL
  USING (user_id = auth.uid());

-- Site Settings: সবাই পড়তে পারবে, admin লিখতে পারবে
CREATE POLICY "Public read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write settings" ON site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Coupons: admin manage করবে
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ============================================================
-- STEP 5: Auto-profile creation trigger
-- ============================================================

-- নতুন user signup করলে automatically profile তৈরি হবে
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    'customer',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger যদি না থাকে তাহলে তৈরি করা
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- STEP 6: Products-এ existing products এর জন্য RLS update
-- ============================================================

-- Products: সবাই পড়তে পারবে (active products), admin লিখতে পারবে
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public read active products'
  ) THEN
    CREATE POLICY "Public read active products" ON products FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admin manage products'
  ) THEN
    CREATE POLICY "Admin manage products" ON products FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
  END IF;
END $$;

-- ============================================================
-- STEP 7: আপনার নিজের অ্যাকাউন্টকে super_admin করুন
-- (নিচের SQL-এ আপনার email দিন)
-- ============================================================

-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com');

-- ============================================================
-- সম্পন্ন! এখন আপনার Supabase Dashboard-এ:
-- 1. Authentication → Users-এ গিয়ে নতুন user তৈরি করুন
-- 2. উপরের UPDATE query-তে আপনার email দিয়ে super_admin করুন
-- ============================================================
