import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const isPharmacy = user.role === 'pharmacy';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-cross" aria-hidden="true" />
          PharmaStock
        </div>
        <nav>
          {isPharmacy ? (
            <>
              <NavLink to="/pharmacy/orders">Incoming orders</NavLink>
              <NavLink to="/pharmacy/inventory">Drug inventory</NavLink>
              <NavLink to="/pharmacy/stock-in">Receive stock</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/department/order">Order drugs</NavLink>
              <NavLink to="/department/orders">My orders</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="who">{user.name}</div>
          <div className="dept">
            {isPharmacy ? 'Pharmacy staff' : user.departmentName}
          </div>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
