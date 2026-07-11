const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export default function StatusStamp({ status }) {
  return <span className={`stamp stamp--${status}`}>{LABELS[status] || status}</span>;
}
