import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-ink-900 text-surface-50 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-white rounded-full flex items-center justify-center text-ink-900 font-serif font-bold text-xl shadow-lg ring-2 ring-rose-200">
                                <img
                                    src="/logo.png"
                                    alt="Glamour Beauty Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="font-serif text-2xl font-bold text-surface-50 tracking-tight">
                                Glamour<span className="text-rose-400">Beauty</span>
                            </span>
                        </Link>
                        <p className="text-ink-300 text-sm leading-relaxed mb-6">
                            Experience timeless glamour with beauty services designed for pure elegance.
                        </p>
                        <div className="flex space-x-4">
                            {['Facebook', 'Twitter', 'Instagram'].map(social => (
                                <div key={social} className="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center hover:bg-rose-500 transition-colors duration-300 cursor-pointer text-xs text-surface-100">
                                    {social[0]}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-serif font-semibold text-rose-100 mb-6">Explore</h4>
                        <ul className="space-y-3 text-sm text-ink-300">
                            <li><Link to="/" className="hover:text-rose-300 transition-colors">Home</Link></li>
                            <li><Link to="/services" className="hover:text-rose-300 transition-colors">Services</Link></li>
                            <li><Link to="/staff" className="hover:text-rose-300 transition-colors">Our Team</Link></li>
                            <li><Link to="/contact" className="hover:text-rose-300 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-serif font-semibold text-rose-100 mb-6">Popular Services</h4>
                        <ul className="space-y-3 text-sm text-ink-300">
                            <li>Facial Treatments</li>
                            <li>Hair Styling & Cuts</li>
                            <li>Bridal Makeup</li>
                            <li>Manicure & Pedicure</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-serif font-semibold text-rose-100 mb-6">Contact</h4>
                        <ul className="space-y-3 text-sm text-ink-300">
                            <li className="flex items-start gap-3">
                                <span className="text-rose-400 mt-1">📍</span>
                                Main Road Junction, <br /> Thagarapuvalasa, 531162
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-rose-400">📞</span>
                                +91 9876543210
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-rose-400">✉️</span>
                                glamour@beauty.com
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-ink-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ink-500">
                    <p>&copy; {new Date().getFullYear()} Glamour Beauty Parlour. All rights reserved.</p>
                    <div className="flex space-x-6">
                        <Link to="#" className="hover:text-surface-50 transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-surface-50 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;