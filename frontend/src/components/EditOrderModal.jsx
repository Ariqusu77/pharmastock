import { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../api';
import { useToast } from './Toast';

// Lets a department reshape a pending order: change quantities, drop
// lines, add drugs from the catalog and rewrite the note. Saving sends
// the whole order via PUT /orders/:id.
export default function EditOrderModal({ order, onClose, onSaved }) {
  const [drugs, setDrugs] = useState([]);
  const [lines, setLines] = useState(
    order.details.map((d) => ({ drug: d.drug, quantity: String(d.quantity) }))
  );
  const [note, setNote] = useState(order.note || '');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/drugs').then((res) => setDrugs(res.data));
  }, []);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const inOrder = new Set(lines.map((line) => line.drug.id));
    return drugs
      .filter(
        (d) =>
          !inOrder.has(d.id) &&
          [d.name, d.code, d.category].some((v) => v.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [drugs, lines, search]);

  const setQuantity = (drugId, value) =>
    setLines(lines.map((line) => (line.drug.id === drugId ? { ...line, quantity: value } : line)));

  const removeLine = (drugId) => setLines(lines.filter((line) => line.drug.id !== drugId));

  const addDrug = (drug) => {
    setLines([...lines, { drug, quantity: '1' }]);
    setSearch('');
  };

  const save = async (e) => {
    e.preventDefault();
    const items = lines.map((line) => ({
      drugId: line.drug.id,
      quantity: parseInt(line.quantity, 10) || 0,
    }));
    if (items.length === 0) {
      toast('Keep at least one drug on the order', 'error');
      return;
    }
    if (items.some((i) => i.quantity < 1)) {
      toast('Every quantity must be at least 1', 'error');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.put(`/orders/${order.id}`, {
        note: note.trim() || undefined,
        items,
      });
      toast(`Order ${order.orderNumber} updated`);
      onSaved(data);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          Edit <span className="mono">{order.orderNumber}</span>
        </h2>
        <form onSubmit={save}>
          {lines.map((line) => (
            <div key={line.drug.id} className="edit-line">
              <span>
                <span className="mono">{line.drug.code}</span> — {line.drug.name}
              </span>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => setQuantity(line.drug.id, e.target.value)}
                aria-label={`Quantity of ${line.drug.name}`}
              />
              <button
                type="button"
                onClick={() => removeLine(line.drug.id)}
                aria-label={`Remove ${line.drug.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {lines.length === 0 && <p className="cart-empty">No drugs left — add one below.</p>}
          <hr className="tearline" />
          <div className="field">
            <label htmlFor="edit-add">Add a drug</label>
            <input
              id="edit-add"
              type="search"
              placeholder="Search by name, code or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {suggestions.length > 0 && (
            <ul className="edit-suggestions">
              {suggestions.map((drug) => (
                <li key={drug.id}>
                  <span>
                    <span className="mono">{drug.code}</span> — {drug.name}
                  </span>
                  <button type="button" className="btn btn--ghost" onClick={() => addDrug(drug)}>
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="field">
            <label htmlFor="edit-note">Note for the pharmacy (optional)</label>
            <textarea id="edit-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--primary" disabled={busy}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
