import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useToast } from '../components/Toast';

export default function PlaceOrder() {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState({}); // drugId -> input value
  const [cart, setCart] = useState([]); // [{ drug, quantity }]
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/drugs').then((res) => setDrugs(res.data));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter((d) =>
      [d.name, d.code, d.category].some((v) => v.toLowerCase().includes(q))
    );
  }, [drugs, search]);

  const addToCart = (drug) => {
    const quantity = parseInt(qty[drug.id] || '1', 10);
    if (!quantity || quantity < 1) return;
    setCart((prev) => {
      const existing = prev.find((line) => line.drug.id === drug.id);
      if (existing) {
        return prev.map((line) =>
          line.drug.id === drug.id ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...prev, { drug, quantity }];
    });
    setQty({ ...qty, [drug.id]: '' });
  };

  const removeLine = (drugId) => setCart(cart.filter((line) => line.drug.id !== drugId));

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/orders', {
        note: note.trim() || undefined,
        items: cart.map((line) => ({ drugId: line.drug.id, quantity: line.quantity })),
      });
      toast('Order sent to the pharmacy');
      setCart([]);
      setNote('');
      navigate('/department/orders');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Department</span>
        <h1>Order drugs</h1>
        <p>Pick from the pharmacy catalog and send one request for your department.</p>
      </div>
      <div className="order-layout">
        <section>
          <div className="toolbar">
            <input
              type="search"
              placeholder="Search by name, code or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search drugs"
            />
          </div>
          <div className="catalog">
            {visible.map((drug) => (
              <article key={drug.id} className="card drug-card">
                <span className="code mono">{drug.code}</span>
                <h3>{drug.name}</h3>
                <span className="meta">
                  {drug.category} · in stock: <span className="mono">{drug.stock}</span> {drug.unit}
                </span>
                {drug.stock === 0 ? (
                  <span className="oos">Out of stock</span>
                ) : (
                  <div className="row">
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={qty[drug.id] || ''}
                      onChange={(e) => setQty({ ...qty, [drug.id]: e.target.value })}
                      aria-label={`Quantity of ${drug.name}`}
                    />
                    <button className="btn btn--ghost" onClick={() => addToCart(drug)}>
                      Add
                    </button>
                  </div>
                )}
              </article>
            ))}
            {visible.length === 0 && <p className="empty">No drugs match this search.</p>}
          </div>
        </section>
        <aside className="card cart">
          <h2>This order</h2>
          {cart.length === 0 && <p className="cart-empty">Nothing added yet.</p>}
          {cart.map((line) => (
            <div key={line.drug.id} className="cart-line">
              <span>{line.drug.name}</span>
              <span className="mono">
                {line.quantity} {line.drug.unit}
              </span>
              <button
                onClick={() => removeLine(line.drug.id)}
                aria-label={`Remove ${line.drug.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <hr className="tearline" />
              <textarea
                rows={2}
                placeholder="Note for the pharmacy (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn btn--primary" onClick={submit} disabled={busy}>
                Send order
              </button>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
