import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface UploadResult {
  success: boolean;
  url?: string;
  message?: string;
}

interface DeleteResult {
  success: boolean;
  error?: unknown;
}

export const uploadImageToCloudinary = async (
  image: string,
  name: string
): Promise<UploadResult> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(image, {
      public_id: name,
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteImageFromCloudinary = async (
  name: string
): Promise<DeleteResult> => {
  try {
    const result = await cloudinary.uploader.destroy(name);
    console.log(result);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
