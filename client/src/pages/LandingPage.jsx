import { Link } from 'react-router-dom';
import heroImage from "../assets/hero-glamour.jpg";

const LandingPage = () => {
    return (
        <div className="font-sans">
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroImage} alt="Glamour Beauty"
                        className="absolute w-full h-full object-cover filter"
                    />
                    <div className="absolute inset-0 bg-surface-50/30 mix-blend-overlay"></div>
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink-700 mb-6 leading-tight animate-fade-in-up">
                        Redefine Your <span className="text-rose-500">Elegance</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-ink-800 mb-10 font-light max-w-2xl mx-auto">
                        Experience world-class beauty treatments in a sanctuary of luxury and relaxation.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link
                            to="/services"
                            className="px-8 py-4 bg-rose-500 text-white text-lg font-semibold rounded-full shadow-lg shadow-rose-900/20 hover:bg-rose-600 transition-all duration-300 hover:-translate-y-1 transform"
                        >
                            View Services
                        </Link>
                        <Link
                            to="/booking"
                            className="px-8 py-4 bg-white backdrop-blur-md border border-surface-50/30 text-rose-500 text-lg font-semibold rounded-full hover:bg-surface-50/20 transition-all duration-300 hover:-translate-y-1 transform"
                        >
                            Book Appointment
                        </Link>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-surface-200">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition duration-300 group border border-ui-200 hover:border-rose-200">
                            <div className="w-16 h-16 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                                ✨
                            </div>
                            <h3 className="text-2xl font-serif font-semibold text-ink-900 mb-4">Premium Products</h3>
                            <p className="text-ink-500">We use only the finest, eco-friendly, and dermatologist-tested products for your skin and hair.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition duration-300 group border border-ui-200 hover:border-rose-200">
                            <div className="w-16 h-16 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                                👩‍🎨
                            </div>
                            <h3 className="text-2xl font-serif font-semibold text-ink-900 mb-4">Expert Stylists</h3>
                            <p className="text-ink-500">Our team of award-winning professionals is dedicated to crafting your perfect look.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition duration-300 group border border-ui-200 hover:border-rose-200">
                            <div className="w-16 h-16 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                                ⌛
                            </div>
                            <h3 className="text-2xl font-serif font-semibold text-ink-900 mb-4">Smart Queue and Slot Booking</h3>
                            <p className="text-ink-500">Book your spot or join our virtual queue instantly for a seamless, wait-free parlour experience.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative bg-gradient-to-r from-rose-400 to-rose-700 py-16">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center text-white gap-12">
                    <div>
                        <h3 className="text-5xl text-white font-serif font-bold">5000+</h3>
                        <p className="mt-2 text-lg text-surface-300">Happy Clients</p>
                    </div>

                    <div>
                        <h3 className="text-5xl text-white font-serif font-bold">15+</h3>
                        <p className="mt-2 text-lg text-surface-300">Expert Stylists</p>
                    </div>

                    <div>
                        <h3 className="text-5xl text-white font-serif font-bold">4.9 ★</h3>
                        <p className="mt-2 text-lg text-surface-300">Average Rating</p>
                    </div>

                    <div>
                        <h3 className="text-5xl text-white font-serif font-bold">10+</h3>
                        <p className="mt-2 text-lg text-surface-300">Years Experience</p>
                    </div>
                </div>

            </section>

            <section className="py-20 bg-surface-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-serif font-bold text-rose-500 mb-6">Ready to Transform?</h2>
                    <p className="text-xl text-ink-500 mb-8 max-w-2xl mx-auto">
                        Join our exclusive community and enjoy priority booking, special offers, and more.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-10 py-4 bg-rose-500 text-white font-bold rounded-full shadow-lg shadow-rose-900/50 hover:bg-rose-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                    >
                        Join Now
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;