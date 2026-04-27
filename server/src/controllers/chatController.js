import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import Slot from '../models/Slot.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// ─── In-memory session store (30 min TTL) ────────────────────────────────
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [id, s] of sessions.entries()) {
        if (now - s.lastUpdated > SESSION_TTL) sessions.delete(id);
    }
}, 10 * 60 * 1000);

const freshSession = () => ({
    step: 'IDLE',
    bookingType: 'slot',
    category: null,
    serviceId: null,
    serviceName: null,
    servicePrice: null,
    staffUserId: null,
    staffName: null,
    date: null,
    slotId: null,
    startTime: null,
    endTime: null,
    customerName: null,
    customerEmail: null,
    lastUpdated: Date.now()
});

// ─── Response builder ─────────────────────────────────────────────────────
const r = (message, options = []) => ({ message, options });

// ─── Main menu ────────────────────────────────────────────────────────────
const mainMenu = () => r(
    'What would you like to do today?',
    [
        { label: '📅 Book Appointment (Slot)', value: 'book_slot', type: 'action' },
        { label: '📋 View Services & Prices', value: 'view_services', type: 'action' },
        { label: '👥 View Available Staff', value: 'view_staff', type: 'action' },
        { label: '❌ Cancel Appointment', value: 'cancel', type: 'action' },
    ]
);

// ─── Date helpers ─────────────────────────────────────────────────────────
const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const s = dateStr.trim().toLowerCase();

    if (s === 'today') return new Date().toISOString().split('T')[0];
    if (s === 'tomorrow') {
        return new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

    return null;
};

const dateButtons = () => {
    const fmt = d => d.toISOString().split('T')[0];
    const lbl = d => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return [0, 1, 2, 3].map(offset => {
        const d = new Date(Date.now() + offset * 86400000);
        return {
            label: `📅 ${offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : lbl(d)} (${lbl(d)})`,
            value: fmt(d),
            type: 'date'
        };
    }).concat([{ label: '✏️ Enter Different Date', value: '__type_date__', type: 'type_input' }]);
};

const fmtDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
};

// ─── AI Intent Detection — called ONLY for free text at IDLE ─────────────
const detectIntent = async (message) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { intent: 'unknown', entities: {} };

    const prompt = `You are an intent classifier for a beauty parlour chatbot.
Classify this user message into ONE intent and extract entities if present.

Message: "${message}"

Valid intents: book_slot, join_queue, view_services, view_staff, check_queue, cancel, greeting, unknown

Valid categories: Hair, Skin, Nails, Makeup, Spa, Facial, Massage, Threading, Waxing

Return ONLY valid JSON, no markdown, no extra text:
{"intent":"<intent>","entities":{"category":"<category or null>","serviceName":"<service name or null>"}}`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
                })
            }
        );
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
        return { intent: 'unknown', entities: {} };
    }
};

// ─── Step: IDLE ───────────────────────────────────────────────────────────
const handleIdle = async (session, message, isButtonClick) => {
    // Global action buttons — zero AI cost
    if (isButtonClick) {
        return applyAction(session, message);
    }

    // Free text — single AI call for intent
    const { intent, entities } = await detectIntent(message);

    if (entities?.category) session.category = entities.category;

    switch (intent) {
        case 'book_slot':
            session.bookingType = 'slot';
            session.step = 'SELECTING_CATEGORY';
            return processStep(session, '', true);

        case 'view_services':
            session.step = 'VIEWING_SERVICES';
            return processStep(session, '', true);

        case 'view_staff':
            session.step = 'VIEWING_STAFF';
            return processStep(session, '', true);

        case 'cancel':
            return r(
                "To cancel your appointment, please log in and go to your dashboard → Appointments section.",
                [
                    { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
                    { label: '📅 Book Appointment', value: 'book_slot', type: 'action' }
                ]
            );

        case 'greeting':
            return r(
                "Hi! Welcome to GlamourBeauty 💅 How can I help you today?",
                mainMenu().options
            );

        default:
            return r(
                "I can help you book appointments, or view services. What would you like?",
                mainMenu().options
            );
    }
};

// ─── Step: SELECTING_CATEGORY ─────────────────────────────────────────────
const handleSelectingCategory = async (session) => {
    // If AI already extracted the category, skip to service selection
    if (session.category) {
        session.step = 'SELECTING_SERVICE';
        return processStep(session, session.category, true);
    }

    const categories = [
        { label: '💇 Hair', value: 'Hair', type: 'category' },
        { label: '🧴 Skin', value: 'Skin', type: 'category' },
        { label: '💅 Nails', value: 'Nails', type: 'category' },
        { label: '💄 Makeup', value: 'Makeup', type: 'category' },
        { label: '🛁 Spa', value: 'Spa', type: 'category' },
        { label: '✨ Facial', value: 'Facial', type: 'category' },
        { label: '💆 Massage', value: 'Massage', type: 'category' },
        { label: '🧵 Threading', value: 'Threading', type: 'category' },
        { label: '🪒 Waxing', value: 'Waxing', type: 'category' },
    ];

    const prompt = 'Which service category are you interested in?';

    return r(prompt, categories);
};

// ─── Step: SELECTING_SERVICE ──────────────────────────────────────────────
const handleSelectingService = async (session, message) => {
    // If called from category button, store the category
    if (!session.serviceId && message && message !== '') {
        session.category = message;
    }

    const query = { category: session.category, isActive: true, bookingType: 'slot' };

    const services = await Service.find(query)
        .select('_id name price duration bookingType')
        .sort({ price: 1 });

    if (services.length === 0) {
        const typeLabel = session.bookingType === 'slot' ? 'slot-based' : 'queue-based';
        return r(
            `No ${typeLabel} services found in ${session.category}. Please choose a different category.`,
            [
                { label: '🔙 Back to Categories', value: 'back_to_categories', type: 'action' },
                { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
            ]
        );
    }

    return r(
        `Here are the ${session.category} services:`,
        services.map(s => ({
            label: `${s.name} — ₹${s.price} (${s.duration} min)`,
            value: s._id.toString(),
            type: 'service',
            meta: {
                name: s.name,
                price: s.price,
                duration: s.duration,
                bookingType: s.bookingType
            }
        })).concat([
            { label: '🔙 Back to Categories', value: 'back_to_categories', type: 'action' }
        ])
    );
};

// ─── Step: SELECTING_STAFF ────────────────────────────────────────────────
const handleSelectingStaff = async (session) => {
    const staffList = await Staff.find({
        services: session.serviceId,
        isAvailable: true
    }).populate('user', 'name');

    if (staffList.length === 0) {
        return r(
            `No staff are currently available for ${session.serviceName}. Please try a different service.`,
            [
                { label: '🔙 Change Service', value: 'back_to_categories', type: 'action' },
                { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
            ]
        );
    }

    return r(
        `Who would you like for your ${session.serviceName}?`,
        staffList.map(s => ({
            label: `${s.user?.name || 'Staff'} ${s.rating > 0 ? `⭐ ${s.rating.toFixed(1)}` : '(New)'}`,
            value: s.user?._id.toString(),
            type: 'staff',
            meta: { name: s.user?.name || 'Staff' }
        })).concat([
            { label: '🎲 No Preference', value: '__any_staff__', type: 'staff' }
        ])
    );
};

// ─── Step: SELECTING_DATE ─────────────────────────────────────────────────
const handleSelectingDate = (session, message, isButtonClick) => {
    // Button click with __type_date__ means user wants to type
    if (isButtonClick && message === '__type_date__') {
        return r('Please type the date you want (format: YYYY-MM-DD or DD/MM/YYYY):', []);
    }

    if (!isButtonClick) {
        // Free text — parse date, no AI needed
        const parsed = parseLocalDate(message);
        if (!parsed) {
            return r(
                'I didn\'t recognise that date. Please use YYYY-MM-DD format (e.g. 2026-04-25) or pick from below:',
                dateButtons()
            );
        }
        session.date = parsed;
        session.step = 'SELECTING_SLOT';
        return processStep(session, parsed, true);
    }

    // Button click with YYYY-MM-DD value
    session.date = message;
    session.step = 'SELECTING_SLOT';
    return processStep(session, message, true);
};

// ─── Step: SELECTING_SLOT ─────────────────────────────────────────────────
const handleSelectingSlot = async (session) => {
    const [y, m, d] = session.date.split('-').map(Number);
    const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

    const slots = await Slot.find({
        staff: session.staffUserId,
        service: session.serviceId,
        date: { $gte: startOfDay, $lte: endOfDay },
        isAvailable: true,
        isBooked: false
    }).select('_id startTime endTime').sort({ startTime: 1 });

    if (slots.length === 0) {
        return r(
            `No slots available on ${fmtDate(session.date)} for ${session.staffName}.\n` +
            'Slots may not have been set up yet. Please try a different date.',
            dateButtons().concat([
                { label: '🔙 Change Staff', value: 'change_staff', type: 'action' },
                { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
            ])
        );
    }

    return r(
        `Available slots with ${session.staffName} on ${fmtDate(session.date)}:`,
        slots.map(s => ({
            label: `🕐 ${s.startTime} – ${s.endTime}`,
            value: s._id.toString(),
            type: 'slot',
            meta: { startTime: s.startTime, endTime: s.endTime }
        })).concat([
            { label: '📅 Different Date', value: 'change_date', type: 'action' },
            { label: '🔙 Change Staff', value: 'change_staff', type: 'action' },
        ])
    );
};

// ─── Step: COLLECTING_NAME ────────────────────────────────────────────────
const handleCollectingName = (session, message, isButtonClick) => {
    if (isButtonClick) return r('Please type your full name:', []);

    const name = message.trim();
    if (name.length < 2) {
        return r('Please enter your full name (at least 2 characters):', []);
    }
    session.customerName = name;
    session.step = 'COLLECTING_EMAIL';
    return r(`Thanks ${name}! Please enter your email address:`, []);
};

// ─── Step: COLLECTING_EMAIL ───────────────────────────────────────────────
const handleCollectingEmail = (session, message, isButtonClick) => {
    if (isButtonClick) return r('Please type your email address:', []);

    const email = message.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return r('That doesn\'t look like a valid email. Please enter a valid email address:', []);
    }
    session.customerEmail = email;
    session.step = 'CONFIRMING';
    return processStep(session, '', true);
};

// ─── Step: CONFIRMING ────────────────────────────────────────────────────
const handleConfirming = async (session, message) => {
    if (message === 'confirm') {
        try {
            const customerEmail = session.customerEmail.trim().toLowerCase();
            const matchedUser = await User.findOne({ email: customerEmail }).select('_id');

            const appointment = await Appointment.create({
                user: matchedUser?._id,
                customerName: session.customerName,
                customerEmail,
                service: session.serviceId,
                staff: session.staffUserId,
                slot: session.slotId || undefined,
                date: new Date(`${session.date}T00:00:00`),
                startTime: session.startTime,
                endTime: session.endTime,
                amount: session.servicePrice,
                status: 'pending',
                paymentStatus: 'pending',
                notes: `Chatbot booking - Customer: ${session.customerName}, Email: ${customerEmail}`
            });

            // Mark slot as booked
            if (session.slotId) {
                await Slot.findByIdAndUpdate(session.slotId, {
                    isBooked: true,
                    isAvailable: false,
                    appointment: appointment._id
                });
            }

            const bookingRef = appointment._id.toString().slice(-8).toUpperCase();
            const svcName = session.serviceName;
            const staffName = session.staffName;
            const date = fmtDate(session.date);
            const time = session.startTime;
            const price = session.servicePrice;

            // Reset session
            const sid = session.lastUpdated; // keep reference
            Object.assign(session, freshSession());
            session.lastUpdated = sid;

            return r(
                `✅ Booking Confirmed!\n\n` +
                `📅 Ref: #${bookingRef}\n` +
                `💆 Service: ${svcName}\n` +
                `👤 Staff: ${staffName}\n` +
                `📅 Date: ${date}\n` +
                `🕐 Time: ${time}\n` +
                `💰 Amount: ₹${price}`,
                [
                    {
                        label: '🔗 Pay for this booking',
                        type: 'link',
                        value: `http://localhost:5173/payment/${appointment._id.toString()}`,
                    },
                    { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
                ]
            );
        } catch (err) {
            console.error('Booking error:', err.message);
            return r(
                'Sorry, there was an error creating your booking. Please try again or book on the website.',
                [{ label: '🏠 Main Menu', value: 'main_menu', type: 'action' }]
            );
        }
    }

    // Show booking summary (called when first arriving at CONFIRMING)
    return r(
        `Please confirm your booking:\n\n` +
        `💆 Service: ${session.serviceName} — ₹${session.servicePrice}\n` +
        `👤 Staff: ${session.staffName}\n` +
        `📅 Date: ${fmtDate(session.date)}\n` +
        `🕐 Time: ${session.startTime} – ${session.endTime}\n` +
        `👤 Name: ${session.customerName}\n` +
        `📧 Email: ${session.customerEmail}`,
        [
            { label: '✅ Confirm Booking', value: 'confirm', type: 'confirm' },
            { label: '✏️ Change Service', value: 'back_to_categories', type: 'action' },
            { label: '✏️ Change Date/Time', value: 'change_date', type: 'action' },
            { label: '✏️ Change Staff', value: 'change_staff', type: 'action' },
            { label: '❌ Cancel', value: 'cancel_booking', type: 'action' },
        ]
    );
};

// ─── Step: VIEWING_SERVICES ───────────────────────────────────────────────
const handleViewingServices = async (session) => {
    session.step = 'IDLE';
    const services = await Service.find({ isActive: true })
        .select('name price duration category bookingType')
        .sort({ category: 1, price: 1 });

    if (services.length === 0) {
        return r('No services found.', mainMenu().options);
    }

    const grouped = services.reduce((acc, s) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(`  • ${s.name} — ₹${s.price} (${s.duration} min)`);
        return acc;
    }, {});

    const text = Object.entries(grouped)
        .map(([cat, list]) => `**${cat}**\n${list.join('\n')}`)
        .join('\n\n');

    return r(`Here are all our services:\n\n${text}`, mainMenu().options);
};

// ─── Step: VIEWING_STAFF ──────────────────────────────────────────────────
const handleViewingStaff = async (session) => {
    session.step = 'IDLE';
    const staffList = await Staff.find({ isAvailable: true })
        .populate('user', 'name')
        .populate('services', 'name')
        .select('user specialization rating services');

    if (staffList.length === 0) {
        return r('No staff available at the moment.', mainMenu().options);
    }

    const text = staffList.map(s => {
        const name = s.user?.name || 'Staff';
        const specs = s.specialization?.join(', ') || '';
        const rating = s.rating > 0 ? `⭐ ${s.rating.toFixed(1)}` : '(New)';
        const svcs = s.services?.map(sv => sv.name).slice(0, 3).join(', ') || '';
        return `👤 ${name} ${rating}\n  Services: ${svcs}${specs ? `\n  Specialization: ${specs}` : ''}`;
    }).join('\n\n');

    return r(`Our available staff members:\n\n${text}`, mainMenu().options);
};

// ─── Global action handler (buttons that can fire from any step) ──────────
const applyAction = async (session, action) => {
    switch (action) {
        case 'book_slot':
            Object.assign(session, freshSession());
            session.bookingType = 'slot';
            session.step = 'SELECTING_CATEGORY';
            return processStep(session, '', true);

        case 'view_services':
            session.step = 'VIEWING_SERVICES';
            return processStep(session, '', true);

        case 'view_staff':
            session.step = 'VIEWING_STAFF';
            return processStep(session, '', true);

        case 'cancel':
            return r(
                "To cancel your appointment, please log in and go to your dashboard → Appointments section.",
                [
                    { label: '🏠 Main Menu', value: 'main_menu', type: 'action' },
                    { label: '📅 Book Appointment', value: 'book_slot', type: 'action' }
                ]
            );

        case 'cancel_booking':
            Object.assign(session, freshSession());
            return r('No problem, booking cancelled. What else can I help you with?', mainMenu().options);

        case 'main_menu':
            Object.assign(session, freshSession());
            return mainMenu();

        case 'back_to_categories':
            session.step = 'SELECTING_CATEGORY';
            session.serviceId = null; session.serviceName = null;
            session.staffUserId = null; session.staffName = null;
            session.date = null; session.slotId = null;
            session.startTime = null; session.endTime = null;
            session.category = null;
            return processStep(session, '', true);

        case 'change_staff':
            session.step = 'SELECTING_STAFF';
            session.staffUserId = null; session.staffName = null;
            session.slotId = null; session.startTime = null; session.endTime = null;
            return processStep(session, '', true);

        case 'change_date':
            session.step = 'SELECTING_DATE';
            session.date = null; session.slotId = null;
            session.startTime = null; session.endTime = null;
            return r('Which date would you like?', dateButtons());

        case 'confirm':
            return handleConfirming(session, 'confirm');

        default:
            return mainMenu();
    }
};

// ─── Main dispatcher ──────────────────────────────────────────────────────
const processStep = async (session, message, isButtonClick, type, meta) => {

    // Handle typed input overrides at specific steps
    if (!isButtonClick && session.step === 'SELECTING_DATE') {
        return handleSelectingDate(session, message, false);
    }
    if (!isButtonClick && session.step === 'COLLECTING_NAME') {
        return handleCollectingName(session, message, false);
    }
    if (!isButtonClick && session.step === 'COLLECTING_EMAIL') {
        return handleCollectingEmail(session, message, false);
    }

    // Handle global action buttons from any step
    if (isButtonClick && type === 'action') {
        return applyAction(session, message);
    }

    // Handle typed confirm at confirming step
    if (isButtonClick && type === 'confirm') {
        return handleConfirming(session, 'confirm');
    }

    // Step-specific button handlers
    switch (session.step) {
        case 'IDLE':
            return handleIdle(session, message, isButtonClick);

        case 'SELECTING_CATEGORY':
            if (isButtonClick && type === 'category') {
                session.category = message;
                session.step = 'SELECTING_SERVICE';
                return processStep(session, message, true, 'category_set');
            }
            return handleSelectingCategory(session);

        case 'SELECTING_SERVICE':
            if (isButtonClick && type === 'service') {
                // Store service details passed from button meta
                session.serviceId = message;
                session.serviceName = meta?.name || message;
                session.servicePrice = meta?.price || 0;
                session.step = 'SELECTING_STAFF';
                return processStep(session, '', true);
            }
            return handleSelectingService(session, message);

        case 'SELECTING_STAFF':
            if (isButtonClick && (type === 'staff' || type === 'staff_pref')) {
                if (message === '__any_staff__') {
                    // Pick first available staff — re-query
                    const staffList = await Staff.find({
                        services: session.serviceId, isAvailable: true
                    }).populate('user', 'name').limit(1);
                    if (staffList.length > 0) {
                        session.staffUserId = staffList[0].user?._id.toString();
                        session.staffName = staffList[0].user?.name || 'Staff';
                    } else {
                        return r('No staff available. Please try again later.', mainMenu().options);
                    }
                } else {
                    session.staffUserId = message;
                    session.staffName = meta?.name || 'Staff';
                }
                session.step = 'SELECTING_DATE';
                return r(`Great! When would you like your appointment with ${session.staffName}?`, dateButtons());
            }
            return handleSelectingStaff(session);

        case 'SELECTING_DATE':
            return handleSelectingDate(session, message, isButtonClick);

        case 'SELECTING_SLOT':
            if (isButtonClick && type === 'slot') {
                session.slotId = message;
                session.startTime = meta?.startTime || '';
                session.endTime = meta?.endTime || '';
                session.step = 'COLLECTING_NAME';
                return r('Great! To finalise your booking, please type your full name:', []);
            }
            return handleSelectingSlot(session);

        case 'COLLECTING_NAME':
            return handleCollectingName(session, message, isButtonClick);

        case 'COLLECTING_EMAIL':
            return handleCollectingEmail(session, message, isButtonClick);

        case 'CONFIRMING':
            if (isButtonClick && message === 'confirm') {
                return handleConfirming(session, 'confirm');
            }
            return handleConfirming(session, '');

        case 'VIEWING_SERVICES':
            return handleViewingServices(session);

        case 'VIEWING_STAFF':
            return handleViewingStaff(session);

        default:
            Object.assign(session, freshSession());
            return mainMenu();
    }
};

// ─── Express handler ──────────────────────────────────────────────────────
export const handleChat = async (req, res) => {
    const { message = '', sessionId, isButtonClick = false, type = '', meta = {}, user } = req.body;

    if (!sessionId) {
        return res.status(400).json({ message: 'sessionId is required', options: [] });
    }

    let session = sessions.get(sessionId);
    if (!session) {
        session = freshSession();
    }
    if (user) {
        session.customerName = user.name;
        session.customerEmail = user.email;
    }
    session.lastUpdated = Date.now();

    try {
        const response = await processStep(session, message, isButtonClick, type, meta);
        sessions.set(sessionId, session);
        return res.json(response);
    } catch (err) {
        console.error('Chat handler error:', err.message);
        sessions.set(sessionId, session);
        return res.json(r(
            'Something went wrong. Please try again.',
            mainMenu().options
        ));
    }
};

// ─── Initial greeting handler ─────────────────────────────────────────────
export const startChat = (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required', options: [] });

    // Reset session on new chat open
    sessions.set(sessionId, freshSession());

    return res.json(r(
        'Hi! Welcome to GlamourBeauty 💅\nI can help you book appointments, view services, and manage your bookings.\n\nWhat would you like to do?',
        mainMenu().options
    ));
};

