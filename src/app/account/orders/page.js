"use client";
import styles from './page.module.css';

export default function OrdersPage() {
  const orders = [
    {
      id: "#CV-9824",
      date: "Oct 24, 2023",
      total: "BDT 12,500",
      status: "Processing",
      items: [
        { name: "Classic Midnight Panjabi", size: "42", qty: 1, image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=200&auto=format&fit=crop" }
      ]
    },
    {
      id: "#CV-8102",
      date: "Aug 15, 2023",
      total: "BDT 18,000",
      status: "Delivered",
      items: [
        { name: "Royal Emerald Thobe", size: "54", qty: 1, image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=200&auto=format&fit=crop" },
        { name: "Premium Leather Sandals", size: "43", qty: 1, image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=200&auto=format&fit=crop" }
      ]
    },
    {
      id: "#CV-7431",
      date: "May 02, 2023",
      total: "BDT 15,000",
      status: "Delivered",
      items: [
        { name: "Silk Blend Abaya", size: "Free", qty: 1, image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=200&auto=format&fit=crop" }
      ]
    }
  ];

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>Order History</h2>
      <p className={styles.subtitle}>Check the status of recent orders, manage returns, and discover similar products.</p>

      <div className={styles.ordersList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div className={styles.headerInfo}>
                <div>
                  <p className={styles.label}>Order Number</p>
                  <p className={styles.value}>{order.id}</p>
                </div>
                <div className={styles.divider}></div>
                <div>
                  <p className={styles.label}>Date Placed</p>
                  <p className={styles.value}>{order.date}</p>
                </div>
                <div className={styles.divider}></div>
                <div>
                  <p className={styles.label}>Total Amount</p>
                  <p className={styles.value}>{order.total}</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.invoiceBtn}>View Invoice</button>
              </div>
            </div>

            <div className={styles.orderDetails}>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${order.status === 'Processing' ? styles.statusProcessing : styles.statusDelivered}`}>
                  {order.status}
                </span>
                <p className={styles.statusText}>
                  {order.status === 'Processing' ? 'Expected delivery by Oct 28' : 'Delivered on time'}
                </p>
              </div>

              <div className={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.item}>
                    <img src={item.image} alt={item.name} />
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p>Size: {item.size}</p>
                      <p>Qty: {item.qty}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <button className={styles.actionBtn}>Buy Again</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
