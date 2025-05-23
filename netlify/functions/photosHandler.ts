import { Handler } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const handler: Handler = async (event) => {
  try {
    const folder = event.queryStringParameters?.folder;
    const searchQuery = folder ? `folder:${folder}` : 'resource_type=image' // Fetch all photos with resource_type=image, also could be just ''
    const searchResult = await cloudinary.search
      .expression(searchQuery)
      .sort_by('public_id', 'asc')
      .max_results(100)
      .execute();
    const photos = searchResult.resources.map((file: { secure_url: string }) => file.secure_url);
    return {
      statusCode: 200,
      body: JSON.stringify(photos),
    };
  } catch (error) {
    console.error('Cloudinary error: ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch photos' }),
    };
  }
};
