export async function finalizeStripeCheckoutPayment(admin, session, source = 'stripe') {
  const orderId = session?.metadata?.order_id || session?.client_reference_id;
  if (!orderId) {
    return { updated: false, reason: 'Stripe session has no linked order ID.' };
  }

  const paid = session.payment_status === 'paid' || session.status === 'complete';
  const nextPaymentStatus = paid ? 'paid' : 'pending';
  const nextOrderStatus = paid ? 'confirmed' : null;

  const { data: payment } = await admin
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment) {
    await admin
      .from('payments')
      .update({
        status: nextPaymentStatus,
        provider_reference: session.id,
        raw_payload: {
          ...(payment.raw_payload || {}),
          checkout_session_id: session.id,
          payment_intent: session.payment_intent || null,
          stripe_status: session.status,
          stripe_payment_status: session.payment_status,
        },
      })
      .eq('id', payment.id);

    await admin.from('payment_events').insert({
      payment_id: payment.id,
      order_id: orderId,
      event_type: paid ? 'stripe.checkout_session.paid' : 'stripe.checkout_session.updated',
      provider: 'stripe',
      provider_reference: session.id,
      status: nextPaymentStatus,
      raw_payload: {
        source,
        session_id: session.id,
        payment_intent: session.payment_intent || null,
        stripe_status: session.status,
        stripe_payment_status: session.payment_status,
      },
    });
  }

  if (paid) {
    const { data: order } = await admin
      .from('orders')
      .select('id,status,payment_status')
      .eq('id', orderId)
      .single();

    await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: order?.status === 'pending' ? 'confirmed' : order?.status || 'confirmed',
      })
      .eq('id', orderId);

    await admin.from('order_status_events').insert({
      order_id: orderId,
      event_type: 'payment.stripe_paid',
      from_status: order?.status || 'pending',
      to_status: nextOrderStatus,
      note: 'Stripe payment confirmed.',
      metadata: {
        source,
        checkout_session_id: session.id,
        payment_intent: session.payment_intent || null,
      },
    });
  }

  return { updated: true, paid, orderId };
}
