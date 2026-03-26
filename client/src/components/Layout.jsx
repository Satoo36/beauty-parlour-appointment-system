import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GlobalNotification from "./GlobalNotification";

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans text-ink-900 bg-surface-100">
            <Navbar />
            <GlobalNotification />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
