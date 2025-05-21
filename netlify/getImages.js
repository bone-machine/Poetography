const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async function () {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:test')
      .sort_by('public_id', 'asc')
      .max_results(30)
      .execute();

    const imageUrls = resources.map((file) => file.secure_url);
    return {
      statusCode: 200,
      body: JSON.stringify(imageUrls),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch images' }),
    };
  }
};