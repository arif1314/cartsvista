import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { searchParams } = new URL(request.url);
  const rangeDays = Math.min(365, Math.max(7, Number(searchParams.get('days') || 30)));
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - rangeDays + 1);
  rangeStart.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const admin = createSupabaseAdminClient();
  const [
    ordersResult,
    customersResult,
    productsResult,
    recentOrdersResult,
    orderItemsResult,
    lowStockResult,
    stockMovementsResult,
  ] = await Promise.all([
    admin.from('orders').select('id,total_amount,status,payment_status,created_at', { count: 'exact' }),
    admin.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
    admin.from('products').select('id,stock,status', { count: 'exact' }).neq('status', 'archived'),
    admin
      .from('orders')
      .select('id,total_amount,status,created_at,shipping_address,customer_email')
      .order('created_at', { ascending: false })
      .limit(6),
    admin
      .from('order_items')
      .select('product_id,product_name,quantity,price,orders(status,created_at)'),
    admin
      .from('products')
      .select('id,name,sku,stock,status')
      .neq('status', 'archived')
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(8),
    admin
      .from('stock_movements')
      .select('id,product_id,movement_type,delta,previous_stock,new_stock,note,created_at,products(name,sku)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (ordersResult.error) return fail(ordersResult.error.message, 500);
  if (customersResult.error) return fail(customersResult.error.message, 500);
  if (productsResult.error) return fail(productsResult.error.message, 500);
  if (recentOrdersResult.error) return fail(recentOrdersResult.error.message, 500);
  if (orderItemsResult.error) return fail(orderItemsResult.error.message, 500);
  if (lowStockResult.error) return fail(lowStockResult.error.message, 500);
  if (stockMovementsResult.error) return fail(stockMovementsResult.error.message, 500);

  const orders = ordersResult.data || [];
  const paidOrActiveOrders = orders.filter((order) => order.status !== 'canceled');
  const revenue = paidOrActiveOrders
    .filter((order) => order.status !== 'canceled')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const rangeOrders = paidOrActiveOrders.filter((order) => new Date(order.created_at) >= rangeStart);
  const todayOrders = paidOrActiveOrders.filter((order) => new Date(order.created_at) >= todayStart);
  const rangeRevenue = rangeOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const averageOrderValue = paidOrActiveOrders.length > 0 ? revenue / paidOrActiveOrders.length : 0;

  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status || 'pending'] = (acc[order.status || 'pending'] || 0) + 1;
    return acc;
  }, {});

  const dailyMap = new Map();
  for (let index = 0; index < rangeDays; index += 1) {
    const day = new Date(rangeStart);
    day.setDate(rangeStart.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, revenue: 0, orders: 0 });
  }

  rangeOrders.forEach((order) => {
    const key = new Date(order.created_at).toISOString().slice(0, 10);
    const day = dailyMap.get(key);
    if (day) {
      day.revenue += Number(order.total_amount || 0);
      day.orders += 1;
    }
  });

  const topProductMap = new Map();
  (orderItemsResult.data || []).forEach((item) => {
    if (item.orders?.status === 'canceled') return;
    const key = item.product_id || item.product_name;
    const existing = topProductMap.get(key) || {
      id: key,
      name: item.product_name || 'Product',
      quantity: 0,
      revenue: 0,
    };
    existing.quantity += Number(item.quantity || 0);
    existing.revenue += Number(item.quantity || 0) * Number(item.price || 0);
    topProductMap.set(key, existing);
  });

  return ok({
    stats: {
      revenue,
      rangeRevenue,
      todayRevenue,
      totalOrders: ordersResult.count || 0,
      rangeOrders: rangeOrders.length,
      pendingOrders: statusBreakdown.pending || 0,
      activeCustomers: customersResult.count || 0,
      activeProducts: productsResult.count || 0,
      lowStockProducts: (lowStockResult.data || []).length,
      averageOrderValue,
    },
    statusBreakdown,
    dailySales: Array.from(dailyMap.values()),
    topProducts: Array.from(topProductMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    lowStockProducts: (lowStockResult.data || []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      stock: Number(product.stock || 0),
      status: product.status,
    })),
    recentStockMovements: (stockMovementsResult.data || []).map((movement) => ({
      id: movement.id,
      productId: movement.product_id,
      productName: movement.products?.name || 'Product',
      sku: movement.products?.sku || '',
      type: movement.movement_type,
      delta: Number(movement.delta || 0),
      previousStock: Number(movement.previous_stock || 0),
      newStock: Number(movement.new_stock || 0),
      note: movement.note || '',
      createdAt: movement.created_at,
    })),
    recentTransactions: (recentOrdersResult.data || []).map((order) => ({
      id: order.id,
      customer:
        `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim()
        || order.customer_email
        || 'Guest',
      date: order.created_at,
      amount: Number(order.total_amount || 0),
      status: order.status || 'pending',
    })),
  });
}
