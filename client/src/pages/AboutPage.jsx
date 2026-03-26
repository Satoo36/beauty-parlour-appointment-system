const AboutPage = () => {
    return (
        <div className="py-16 bg-white min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl font-serif font-bold text-secondary-900 mb-8 text-center">Our Story</h1>
                <div className="prose prose-lg mx-auto text-gray-600">
                    <p className="mb-6">
                        Welcome to <span className="font-semibold text-primary-600">LuxeBeauty</span>, where artistry meets precision. Established in 2020, we started with a simple vision: to create a beauty sanctuary that offers not just services, but an experience.
                    </p>
                    <p className="mb-6">
                        We believe that self-care is a necessity, not a luxury. Our ethos is built on three pillars: <strong>Quality, Hygiene, and Innovation</strong>. We constantly update our techniques and equipment to bring you the latest global trends in beauty and wellness.
                    </p>
                    <div className="my-10">
                        <img
                            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                            alt="Salon Team"
                            className="w-full h-64 object-cover rounded-xl shadow-lg"
                        />
                    </div>
                    <h2 className="text-2xl font-serif font-semibold text-secondary-900 mb-4">Why We Are Different</h2>
                    <p>
                        Unlike traditional salons, we focus on personalized consultations. We understand that every skin type, hair texture, and style preference is unique. Our specialists take the time to listen to your needs before recommending any treatment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
