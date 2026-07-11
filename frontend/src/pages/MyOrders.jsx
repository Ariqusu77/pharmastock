import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import OrderCard from '../components/OrderCard';
import EditOrderModal from '../components/EditOrderModal';
import { useToast } from '../components/Toast';

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'fulfilled', 'cancelled'];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // pending order being edited
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/orders').then((res) => {
      setOrders(res.data);
      setLoaded(true);
    });
  }, []);

  const onSaved = (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setEditing(null);
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}? The pharmacy will not process it.`)) return;
    try {
      const { data } = await api.post(`/orders/${order.id}/cancel`);
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
      toast(`Order ${order.orderNumber} cancelled`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Department</span>
        <h1>My orders</h1>
        <p>
          Track what your department has requested and what the pharmacy decided. Pending
          orders can still be edited or cancelled.
        </p>
      </div>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="orders">
        {visible.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              order.status === 'pending' ? (
                <>
                  <button className="btn btn--ghost" onClick={() => setEditing(order)}>
                    Edit order
                  </button>
                  <button className="btn btn--danger" onClick={() => cancelOrder(order)}>
                    Cancel order
                  </button>
                </>
              ) : null
            }
          />
        ))}
        {loaded && visible.length === 0 && (
          <p className="empty">No orders here yet. Place one from “Order drugs”.</p>
        )}
      </div>

      {editing && (
        <EditOrderModal order={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </>
  );
}
