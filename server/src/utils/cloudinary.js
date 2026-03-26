import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (file, folder) => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: folder,
            width: 500,
            crop: 'scale'
        });
        return {
            public_id: result.public_id,
            url: result.secure_url
        };
    } catch(error) {
        throw new Error("Image upload failed");
    }
};

export const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch(error) {
        throw new error("Image deletion failed");
    }
};