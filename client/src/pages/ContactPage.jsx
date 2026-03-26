const ContactPage = () => {
    return (
        <div className="py-20 bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Contact Info */}
                    <div className="md:w-1/2 bg-secondary-900 p-12 text-white flex flex-col justify-between">
                        <div>
                            <h2 className="text-3xl font-serif font-bold mb-6">Get in Touch</h2>
                            <p className="text-gray-300 mb-10">
                                Have questions about our services or want to book a VIP session? We'd love to hear from you.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center text-primary-500">
                                        📍
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Visit Us</h4>
                                        <p className="text-gray-400">Main Road Junction, Thagarapuvalasa<br />531162, Andhra Pradesh</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center text-primary-500">
                                        📞
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Call Us</h4>
                                        <p className="text-gray-400">+91 9876543210</p>
                                        <p className="text-gray-400">Mon-Sun: 10am - 6pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center text-primary-500">
                                        ✉️
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Email Us</h4>
                                        <p className="text-gray-400">glamour@beauty.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 md:mt-0">
                            <div className="flex space-x-4">
                                {/* Social Icons */}
                                {['F', 'T', 'I'].map(s => (
                                    <div key={s} className="w-8 h-8 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-500 transition cursor-pointer">{s}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:w-1/2 p-12">
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" placeholder="Kavya" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" placeholder="kavya@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea rows="4" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" placeholder="How can we help you?"></textarea>
                            </div>
                            <button className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition transform hover:-translate-y-1 shadow-md">
                                Send Message
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactPage;
