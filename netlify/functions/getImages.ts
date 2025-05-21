import { Handler } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const handler: Handler = async () => {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:test')
      .sort_by('public_id', 'asc')
      .max_results(30)
      .execute();

    const imageUrls = resources.map((file: { secure_url: string }) => file.secure_url);

    return {
      statusCode: 200,
      body: JSON.stringify(imageUrls),
    };
  } catch (error) {
    console.error('Cloudinary error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch images' }),
    };
  }
};

export { handler };
