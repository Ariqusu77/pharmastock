import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { useToast } from '../components/Toast';

const EMPTY = { code: '', name: '', category: '', unit: 'tablet', stock: 0, minStock: 10, description: '' };

export default function Inventory() {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | drug object
  const [form, setForm] = useState(EMPTY);
  const toast = useToast();

  const load = (q = '') =>
    api.get('/drugs', { params: q ? { search: q } : {} }).then((res) => setDrugs(res.data));

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (drug) => {
    setForm({ ...drug, description: drug.description || '' });
    setEditing(drug);
  };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      stock: parseInt(form.stock, 10) || 0,
      minStock: parseInt(form.minStock, 10) || 0,
    };
    try {
      if (editing === 'new') {
        await api.post('/drugs', payload);
        toast(`${payload.name} added to the catalog`);
      } else {
        await api.put(`/drugs/${editing.id}`, payload);
        toast(`${payload.name} updated`);
      }
      setEditing(null);
      load(search);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (drug) => {
    if (!window.confirm(`Delete ${drug.name} from the catalog?`)) return;
    try {
      await api.delete(`/drugs/${drug.id}`);
      toast(`${drug.name} deleted`);
      load(search);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Pharmacy</span>
        <h1>Drug inventory</h1>
        <p>The catalog departments order from. Stock in red is below its minimum.</p>
      </div>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, code or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search drugs"
        />
        <button className="btn btn--primary" onClick={openNew}>
          Add drug
        </button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th className="num">Stock</th>
              <th className="num">Min</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((drug) => (
              <tr key={drug.id}>
                <td className="mono">{drug.code}</td>
                <td>{drug.name}</td>
                <td>{drug.category}</td>
                <td>{drug.unit}</td>
                <td className={`num mono${drug.stock <= drug.minStock ? ' lowstock' : ''}`}>
                  {drug.stock}
                </td>
                <td className="num mono">{drug.minStock}</td>
                <td>
                  <button className="btn btn--ghost" onClick={() => openEdit(drug)}>
                    Edit
                  </button>{' '}
                  <button className="btn btn--danger" onClick={() => remove(drug)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {drugs.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No drugs in the catalog yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing === 'new' ? 'Add drug' : `Edit ${editing.name}`}</h2>
            <form onSubmit={save}>
              <div className="row2">
                <div className="field">
                  <label htmlFor="d-code">Code</label>
                  <input id="d-code" value={form.code} onChange={set('code')} required />
                </div>
                <div className="field">
                  <label htmlFor="d-cat">Category</label>
                  <input id="d-cat" value={form.category} onChange={set('category')} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-name">Name</label>
                <input id="d-name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="d-unit">Unit</label>
                  <input id="d-unit" value={form.unit} onChange={set('unit')} required />
                </div>
                <div className="field">
                  <label htmlFor="d-stock">Stock</label>
                  <input id="d-stock" type="number" min="0" value={form.stock} onChange={set('stock')} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-min">Minimum stock (low-stock warning)</label>
                <input id="d-min" type="number" min="0" value={form.minStock} onChange={set('minStock')} required />
              </div>
              <div className="field">
                <label htmlFor="d-desc">Description (optional)</label>
                <textarea id="d-desc" rows={2} value={form.description} onChange={set('description')} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button className="btn btn--primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
