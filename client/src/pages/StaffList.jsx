import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { staffService } from "../api/api";

const serviceIcons = {
    Hair: "✂️",
    Facial: "🧖‍♀️",
    Nails: "💅",
    Massage: "💆‍♀️",
    Makeup: "💄",
    Threading: "🧵",
    Waxing: "✨"
};

const StaffList = () => {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await staffService.getAll();
                setStaffMembers(res.data?.data || res.data || []);
            } catch (err) {
                console.error("Error fetching staff", err);
                setStaffMembers([
                    {
                        _id: '1',
                        name: 'Ananya Sharma',
                        role: 'Senior Hair Stylist',
                        bio: 'Expert in trendy haircuts, global coloring, and hair spa treatments with 8+ years experience.',
                        specialty: 'Hair',
                        image: '/images/staff/ananya-sharma.jpg'
                    },
                    {
                        _id: '2',
                        name: 'Rohit',
                        role: 'Hair Color Specialist',
                        bio: 'Specializes in global and creative hair coloring techniques using premium products.',
                        specialty: 'Hair',
                        image: '/images/staff/rohit.jpg'
                    },
                    {
                        _id: '3',
                        name: 'Priya',
                        role: 'Senior Beautician',
                        bio: 'Specialist in classic, gold, and fruit facials focused on glowing and healthy skin.',
                        specialty: 'Facial',
                        image: '/images/staff/priya.jpg'
                    },
                    {
                        _id: '4',
                        name: 'Meera',
                        role: 'Skin Care Expert',
                        bio: 'Expert in deep cleansing facials and advanced skincare treatments.',
                        specialty: 'Facial',
                        image: '/images/staff/meera.jpg'
                    },
                    {
                        _id: '5',
                        name: 'Kavita Reddy',
                        role: 'Nail Technician',
                        bio: 'Professional nail artist skilled in gel manicures, pedicures, and nail shaping.',
                        specialty: 'Nails',
                        image: '/images/staff/kavitha.jpg'
                    },
                    {
                        _id: '6',
                        name: 'Sneha Kulkarni',
                        role: 'Massage Therapist',
                        bio: 'Certified massage expert specialized in full body and stress-relief therapies.',
                        specialty: 'Massage',
                        image: '/images/staff/sneha.jpg'
                    },
                    {
                        _id: '7',
                        name: 'shreya',
                        role: 'Wellness Therapist',
                        bio: 'Expert in head, back, and shoulder massage techniques for deep relaxation.',
                        specialty: 'Massage',
                        image: '/images/staff/shreya.jpg'
                    },
                    {
                        _id: '8',
                        name: 'Aishwarya Rao',
                        role: 'Bridal Makeup Artist',
                        bio: 'Professional bridal and engagement makeup artist with luxury glam styling experience.',
                        specialty: 'Makeup',
                        image: '/images/staff/aishwarya.jpg'
                    },
                    {
                        _id: '9',
                        name: 'Neha',
                        role: 'Event Makeup Artist',
                        bio: 'Creates stunning party and engagement looks tailored to client preferences.',
                        specialty: 'Makeup',
                        image: '/images/staff/neha.jpg'
                    },
                    {
                        _id: '10',
                        name: 'Pooja',
                        role: 'Threading Specialist',
                        bio: 'Precise eyebrow and facial threading expert with gentle techniques.',
                        specialty: 'Threading',
                        image: '/images/staff/pooja.jpg'
                    },
                    {
                        _id: '11',
                        name: 'Divya',
                        role: 'Waxing Specialist',
                        bio: 'Experienced in full body waxing services ensuring smooth and hygienic results.',
                        specialty: 'Waxing',
                        image: '/images/staff/divya.jpg'
                    }
                ]);

            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    return (
        <div className="bg-surface-100 min-h-screen py-16">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-serif font-bold text-center text-ink-900 mb-4">Meet Our Team</h1>
                <p className="text-center text-ink-500 max-w-2xl mx-auto mb-16">
                    Our talented professionals are dedicated to making you look and feel your best.
                </p>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {staffMembers.map((staff) => {
                            // Helper to extract data whether it's from API or Fallback
                            const isApiData = !!staff.user;
                            const name = isApiData ? staff.user?.name : staff.name;
                            const role = isApiData
                                ? (Array.isArray(staff.specialization) ? staff.specialization.join(', ') : staff.specialization)
                                : staff.role;
                            const bio = isApiData ? staff.about : staff.bio;
                            const specialty = isApiData
                                ? (Array.isArray(staff.specialization) ? staff.specialization[0] : 'General')
                                : staff.specialty;
                            const image = isApiData ? staff.user?.avatar?.url : staff.image;
                            const staffId = isApiData ? staff.user?._id : staff._id;

                            // Determine icon
                            const serviceIcon = serviceIcons[specialty] || "💼";

                            return (
                                <div key={staff._id} className="group text-center">
                                    <div className="relative inline-block mb-6">
                                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto group-hover:border-rose-200 transition duration-300">
                                            <img
                                                src={image || "/images/staff/default.jpg"}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "/images/staff/default.jpg"
                                                }}
                                            />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-white shadow-lg rounded-full p-2 text-xl" title={specialty}>
                                            {serviceIcon}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-ink-900 mb-1 group-hover:text-rose-500 transition-colors">{name}</h3>
                                    <p className="text-rose-500 font-medium mb-3">{role}</p>
                                    <p className="text-ink-500 text-sm mb-6 max-w-xs mx-auto line-clamp-3">{bio || "Dedicated professional ready to serve you."}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    )
};

export default StaffList;