import Service from "../models/Service.js";
import User from "../models/User.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

export const getAllServices = async (req, res, next) => {
    try {
        const { category, isActive, search } = req.query;
        let query = {};

        if (category) {
            query.category = category.trim();
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ];
        }

        const services = await Service.find(query)
            .populate('staffMembers', 'name email avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ count: services.length, data: services });
    } catch (err) {
        next(err);
    }
};

export const getService = async (req, res, next) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id)
            .populate('staffMembers', 'name email avatar');

        if (!service) {
            res.status(404).json({ message: "Service not found" });
        }

        return res.status(200).json({ data: service });
    } catch (err) {
        next(err);
    }
};

export const createService = async (req, res, next) => {
    try {
        const { name, description, duration, price, category, image, staffMembers, bookingType } = req.body;

        if (!name || !description || !duration || !price || !category || !bookingType) {
            return res.status(400).json({ message: "Name, description, price, category and bookingType are required." });
        }

        let serviceImage = null;
        if (image) {
            serviceImage = await uploadImage(image, 'beauty-parlour/services');
        }

        const service = await Service.create({
            name: name.trim(),
            description: description.trim(),
            duration: Number(duration),
            price: Number(price),
            category: category.trim(),
            bookingType,
            image: serviceImage,
            staffMembers: staffMembers || []
        });

        return res.status(201).json({ message: "Service created successfully.", data: service });
    } catch (err) {
        next(err);
    }
};

export const updateService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, duration, price, category, image, staffMembers, isActive } = req.body;
        let service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (image && service.image && service.image.public_id) {
            await deleteImage(service.image.public_id);
            const uploadedImage = await uploadImage(image, 'beauty-parlour/services');
            service.image = uploadedImage;
        }

        if (name !== undefined) service.name = name.trim();
        if (description !== undefined) service.description = description.trim();
        if (duration !== undefined) service.duration = Number(duration);
        if (price !== undefined) service.price = Number(price);
        if (category !== undefined) service.category = category.trim();
        if (staffMembers !== undefined) service.staffMembers = staffMembers;
        if (isActive !== undefined) service.isActive = isActive;

        await service.save();
        return res.status(200).json({ message: "Service updated successfully.", data: service });
    } catch (err) {
        next(err);
    }
};

export const deleteService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (service.image && service.image.public_id) {
            await deleteImage(service.image.public_id);
        }
        await Service.findByIdAndDelete(id);

        console.log(`Service deleted: ${id}`);
        return res.status(200).json({ message: "Service deleted successfully." });
    } catch (err) {
        console.error("Error in deleteService:", err);
        next(err);
    }
};

export const toggleServices = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        service.isActive = !service.isActive;
        await service.save();

        return res.status(200).json({
            message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: service.isActive }
        });
    } catch (err) {
        next(err);
    }
};

export const getServicesByStaff = async (req, res, next) => {
    try {
        const { staffId } = req.params;
        const services = await Service.find({ staffMembers: staffId, isActive: true })
            .populate('staffMembers', 'name email avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ count: services.length, data: services });
    } catch (err) {
        next(err);
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const categories = await Service.distinct('category');

        const filteredCategories = categories
            .filter(cat => cat && cat.trim())
            .sort();

        return res.status(200).json({ count: filteredCategories.length, data: filteredCategories });
    } catch (err) {
        next(err);
    }
};
