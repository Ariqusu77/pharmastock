import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import OrderCard from '../components/OrderCard';
import { useToast } from '../components/Toast';

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'fulfilled', 'cancelled'];

export default function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [rejecting, setRejecting] = useState(null); // order being rejected
  const [reason, setReason] = useState('');
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  const load = () =>
    api.get('/orders').then((res) => {
      setOrders(res.data);
      setLoaded(true);
    });

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (order, status, rejectionReason) => {
    try {
      const { data } = await api.patch(`/orders/${order.id}/status`, { status, rejectionReason });
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
      toast(`Order ${order.orderNumber} ${status}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const confirmReject = async (e) => {
    e.preventDefault();
    await setStatus(rejecting, 'rejected', reason);
    setRejecting(null);
    setReason('');
  };

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Pharmacy</span>
        <h1>Incoming orders</h1>
        <p>Approving an order deducts its quantities from stock. Fulfill it once handed over.</p>
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
                  <button className="btn btn--primary" onClick={() => setStatus(order, 'approved')}>
                    Approve &amp; deduct stock
                  </button>
                  <button className="btn btn--danger" onClick={() => setRejecting(order)}>
                    Reject
                  </button>
                </>
              ) : order.status === 'approved' ? (
                <button className="btn btn--primary" onClick={() => setStatus(order, 'fulfilled')}>
                  Mark as fulfilled
                </button>
              ) : null
            }
          />
        ))}
        {loaded && visible.length === 0 && <p className="empty">No {filter === 'all' ? '' : filter} orders.</p>}
      </div>

      {rejecting && (
        <div className="modal-backdrop" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              Reject <span className="mono">{rejecting.orderNumber}</span>
            </h2>
            <form onSubmit={confirmReject}>
              <div className="field">
                <label htmlFor="reason">Reason (the department will see this)</label>
                <textarea
                  id="reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setRejecting(null)}>
                  Cancel
                </button>
                <button className="btn btn--danger">Reject order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
