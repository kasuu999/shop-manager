
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import dotenv from "dotenv";
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileLink) => {
  const uploadResult = await cloudinary.uploader
    .upload(fileLink, {
      resource_type: "auto",
      folder: "products",
      transformation: [
  { width: 1000, height: 1000, crop: "limit" },
  { quality: "auto", fetch_format: "auto" },
],
    })
    .catch((error) => {
      console.log(error);
      fs.unlinkSync(fileLink);
    });
  return uploadResult;
};

export { cloudinary };
export default uploadToCloudinary;