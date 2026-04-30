import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout() {
    return (
        <div className="drawer lg:drawer-open">
            <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col">
                <Navbar />
                <main className="p-6 bg-base-200 min-h-screen">
                    <Outlet />
                </main>
            </div>
            <div className="drawer-side">
                <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
                <Sidebar />
            </div>
        </div>
    );
}