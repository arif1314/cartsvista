"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import styles from './page.module.css';

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const shippingCost = 150; // Example shipping cost in BDT
  const total = cartTotal > 0 ? cartTotal + shippingCost : 0;
  // Convert BDT to USD (Approximate rate: 1 USD = 110 BDT)
  const totalUSD = (total / 110).toFixed(2);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const shippingAddress = {
      email: formData.get('email'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      address: formData.get('address'),
      apartment: formData.get('apartment'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      phone: formData.get('phone')
    };

    // 1. Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: total,
        status: 'pending',
        shipping_address: shippingAddress,
        payment_method: paymentMethod
      })
      .select()
      .single();

    if (orderError) {
      alert('Failed to place order (DB Error). Details: ' + orderError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Create order items
    // Ensure product_ids match UUID format in DB or handle gracefully if mock items used
    const orderItemsToInsert = cartItems.map(item => ({
      order_id: orderData.id,
      product_id: item.id.length > 10 ? item.id : null, // handle mock short ids temporarily
      quantity: item.quantity,
      size: item.size,
      color: item.color || null,
      price: item.price
    }));

    // Filter out items with mock IDs if your DB restricts product_id (which it does: REFERENCES products)
    // Actually, since mock data ids are 'm1', 'w2', the FK will fail if inserted.
    const validItems = orderItemsToInsert.filter(i => i.product_id);
    if (validItems.length > 0) {
      await supabase.from('order_items').insert(validItems);
    }

    alert(`Order placed successfully!\nOrder ID: ${orderData.id}\nPayment: ${paymentMethod.toUpperCase()}\nTotal Amount: ৳ ${total} / $ ${totalUSD}`);
    // Clear cart context here if you have a method for it
    setIsSubmitting(false);
  };

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={16} /> Return to Shop
        </Link>
        <div className={styles.secureHeader}>
          <ShieldCheck size={18} /> Secure Checkout
        </div>
      </div>

      <div className={styles.checkoutLayout}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.checkoutForm}>
            <div className={styles.sectionTitle}>
              <h2>Contact Information</h2>
            </div>
            <div className={styles.inputGroup}>
              <input type="email" name="email" placeholder="Email Address" required />
            </div>

            <div className={styles.sectionTitle}>
              <h2>Shipping Address</h2>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <input type="text" name="firstName" placeholder="First Name" required />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" name="lastName" placeholder="Last Name" required />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <input type="text" name="address" placeholder="Address (House, Street, etc.)" required />
            </div>
            <div className={styles.inputGroup}>
              <input type="text" name="apartment" placeholder="Apartment, suite, etc. (optional)" />
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <input type="text" name="city" placeholder="City" required />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" name="postalCode" placeholder="Postal Code" required />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <input type="tel" name="phone" placeholder="Phone Number" required />
            </div>

            <div className={styles.sectionTitle}>
              <h2>Payment Method</h2>
            </div>
            
            <div className={styles.paymentMethods}>
              <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentSelected : ''}`}>
                <div className={styles.radioWrapper}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <span>Cash on Delivery (COD)</span>
                </div>
                <Banknote size={24} className={styles.paymentIcon} />
              </label>

              <label className={`${styles.paymentOption} ${paymentMethod === 'bkash' ? styles.paymentSelected : ''}`}>
                <div className={styles.radioWrapper}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="bkash" 
                    checked={paymentMethod === 'bkash'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <span>bKash Payment</span>
                </div>
                <Smartphone size={24} className={styles.paymentIcon} />
              </label>

              <label className={`${styles.paymentOption} ${paymentMethod === 'nagad' ? styles.paymentSelected : ''}`}>
                <div className={styles.radioWrapper}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="nagad" 
                    checked={paymentMethod === 'nagad'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <span>Nagad Payment</span>
                </div>
                <Smartphone size={24} className={styles.paymentIcon} />
              </label>

              <label className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.paymentSelected : ''}`}>
                <div className={styles.radioWrapper}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                  />
                  <span>Credit / Debit Card (Global in USD)</span>
                </div>
                <CreditCard size={24} className={styles.paymentIcon} />
              </label>
            </div>

            <button type="submit" className={styles.placeOrderBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.summaryBox}>
            <h2>Order Summary</h2>
            
            <div className={styles.itemsList}>
              {cartItems.length > 0 ? cartItems.map(item => (
                <div key={`${item.id}-${item.size}`} className={styles.cartItem}>
                  <div className={styles.itemImageContainer}>
                    <div className={styles.itemImageWrapper}>
                      <img src={item.image} alt={item.name} />
                    </div>
                    <span className={styles.itemQuantity}>{item.quantity}</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <h4>{item.name}</h4>
                    <p>Size: {item.size}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    ৳ {item.price * item.quantity}
                  </div>
                </div>
              )) : (
                <p className={styles.emptyNotice}>Your cart is empty.</p>
              )}
            </div>

            <div className={styles.totalsSection}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>৳ {cartTotal}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span>৳ {cartTotal > 0 ? shippingCost : 0}</span>
              </div>
              <div className={styles.divider}></div>
              <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                <span>Total (BDT)</span>
                <span>৳ {total}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.usdTotal}`}>
                <span>Total (USD)</span>
                <span>~ $ {totalUSD}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
