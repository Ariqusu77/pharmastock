import { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../api';
import { useToast } from '../components/Toast';

// Pharmacy records incoming drugs (supplier deliveries). Submitting
// increments stock and writes 'in' movements; the ledger below shows
// every stock change, including 'out' deductions from approved orders.
export default function StockIn() {
  const [drugs, setDrugs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState({}); // drugId -> input value
  const [lines, setLines] = useState([]); // [{ drug, quantity }]
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  const loadDrugs = () => api.get('/drugs').then((res) => setDrugs(res.data));
  const loadMovements = () =>
    api.get('/stock/movements').then((res) => {
      setMovements(res.data);
      setLoaded(true);
    });

  useEffect(() => {
    loadDrugs();
    loadMovements();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter((d) =>
      [d.name, d.code, d.category].some((v) => v.toLowerCase().includes(q))
    );
  }, [drugs, search]);

  const addLine = (drug) => {
    const quantity = parseInt(qty[drug.id] || '1', 10);
    if (!quantity || quantity < 1) return;
    setLines((prev) => {
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

  const removeLine = (drugId) => setLines(lines.filter((line) => line.drug.id !== drugId));

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/stock/in', {
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
        items: lines.map((line) => ({ drugId: line.drug.id, quantity: line.quantity })),
      });
      toast('Stock received and added to inventory');
      setLines([]);
      setReference('');
      setNote('');
      loadDrugs();
      loadMovements();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Pharmacy</span>
        <h1>Receive stock</h1>
        <p>Record incoming drugs from a supplier. Quantities are added to inventory on submit.</p>
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
                <div className="row">
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={qty[drug.id] || ''}
                    onChange={(e) => setQty({ ...qty, [drug.id]: e.target.value })}
                    aria-label={`Quantity of ${drug.name}`}
                  />
                  <button className="btn btn--ghost" onClick={() => addLine(drug)}>
                    Add
                  </button>
                </div>
              </article>
            ))}
            {visible.length === 0 && <p className="empty">No drugs match this search.</p>}
          </div>
        </section>
        <aside className="card cart">
          <h2>This delivery</h2>
          {lines.length === 0 && <p className="cart-empty">Nothing added yet.</p>}
          {lines.map((line) => (
            <div key={line.drug.id} className="cart-line">
              <span>{line.drug.name}</span>
              <span className="mono">
                +{line.quantity} {line.drug.unit}
              </span>
              <button onClick={() => removeLine(line.drug.id)} aria-label={`Remove ${line.drug.name}`}>
                ×
              </button>
            </div>
          ))}
          {lines.length > 0 && (
            <>
              <hr className="tearline" />
              <input
                type="text"
                className="cart-ref"
                placeholder="Supplier / invoice no. (optional)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                aria-label="Delivery reference"
              />
              <textarea
                rows={2}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn btn--primary" onClick={submit} disabled={busy}>
                Add to inventory
              </button>
            </>
          )}
        </aside>
      </div>

      <section className="ledger">
        <h2>Stock ledger</h2>
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Drug</th>
                <th>Type</th>
                <th className="num">Qty</th>
                <th className="num">Balance</th>
                <th>Reference</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>
                    <span className="mono">{m.drug?.code}</span> — {m.drug?.name}
                  </td>
                  <td>
                    <span className={`stamp ${m.type === 'in' ? 'stamp--approved' : 'stamp--fulfilled'}`}>
                      {m.type === 'in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="num mono">
                    {m.type === 'in' ? '+' : '−'}
                    {m.quantity} {m.drug?.unit}
                  </td>
                  <td className="num mono">{m.balanceAfter}</td>
                  <td className="mono">{m.reference || '—'}</td>
                  <td>{m.recordedBy?.name}</td>
                </tr>
              ))}
              {loaded && movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No stock movements yet. Receive a delivery or approve an order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
