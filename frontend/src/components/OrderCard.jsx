import StatusStamp from './StatusStamp';

// Renders one order styled like a medication label: header, dashed
// tear-line, item list in mono, then any pharmacy actions.
export default function OrderCard({ order, actions }) {
  const when = new Date(order.createdAt).toLocaleString();
  return (
    <article className="card order-card">
      <header>
        <div>
          <div className="ordno mono">{order.orderNumber}</div>
          <div className="when">
            {order.requester?.departmentName} · {order.requester?.name} · {when}
          </div>
        </div>
        <StatusStamp status={order.status} />
      </header>
      <hr className="tearline" />
      <table className="order-items">
        <tbody>
          {order.details.map((d) => (
            <tr key={d.id}>
              <td>
                <span className="mono">{d.drug.code}</span> — {d.drug.name}
              </td>
              <td>
                {d.quantity} {d.drug.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.note && (
        <>
          <hr className="tearline" />
          <p className="order-note">“{order.note}”</p>
        </>
      )}
      {order.status === 'rejected' && order.rejectionReason && (
        <p className="order-reject">Rejected: {order.rejectionReason}</p>
      )}
      {order.processedBy && (
        <p className="order-meta">
          Processed by {order.processedBy.name} on{' '}
          {new Date(order.processedAt).toLocaleString()}
        </p>
      )}
      {actions && (
        <>
          <hr className="tearline" />
          <div className="order-actions">{actions}</div>
        </>
      )}
    </article>
  );
}
