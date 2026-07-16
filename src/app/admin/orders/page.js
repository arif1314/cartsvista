"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load orders.');
      }
      setOrders(data.orders || []);
    } catch (error) {
      alert(error.message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to update order.');
      }
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus.toLowerCase() } : o));
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const customerName = `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`.toLowerCase();
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || customerName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || o.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>Manage and fulfill customer orders</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              className={styles.searchInput} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <select 
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Canceled</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const date = new Date(order.created_at).toLocaleDateString();
                  const customer = `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`;
                  const displayId = order.id.length > 8 ? order.id.substring(0, 8) + '...' : order.id;
                  const itemCount = (order.order_items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                  // Capitalize status
                  const capStatus = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';
                  
                  return (
                    <tr key={order.id}>
                      <td className={styles.fw500} title={order.id}>{displayId}</td>
                      <td>{customer || 'Guest'}</td>
                      <td className={styles.textMuted}>{date}</td>
                      <td>{itemCount || '-'}</td>
                      <td className={styles.fw500}>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <select 
                          className={`${styles.statusSelect} ${styles['status' + capStatus]}`}
                          value={capStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Canceled">Canceled</option>
                        </select>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className={styles.actionBtn} title="View Details">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
