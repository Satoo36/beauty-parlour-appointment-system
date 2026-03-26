import React from 'react';

const StaffSummaryCards = ({ stats }) => {
    const cards = [
        {
            title: "Total Appointments",
            count: stats?.total || 0,
            icon: "📅",
            color: "bg-blue-50 text-blue-600 border-blue-100"
        },
        {
            title: "Today's Schedule",
            count: stats?.today || 0,
            icon: "⏰",
            color: "bg-rose-50 text-rose-600 border-rose-100"
        },
        {
            title: "Pending Approval",
            count: stats?.pending || 0,
            icon: "⏳",
            color: "bg-amber-50 text-amber-600 border-amber-100"
        },
        {
            title: "Completed",
            count: stats?.completed || 0,
            icon: "✅",
            color: "bg-emerald-50 text-emerald-600 border-emerald-100"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`p-6 rounded-2xl border ${card.color} shadow-sm transition-all hover:shadow-md transform hover:-translate-y-1`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-2xl">{card.icon}</span>
                        <div className="h-2 w-2 rounded-full bg-current opacity-20"></div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{card.count}</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-70">
                        {card.title}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StaffSummaryCards;
