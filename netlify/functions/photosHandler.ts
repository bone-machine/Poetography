import { Handler } from "@netlify/functions";
import { v2 as cloudinary } from "cloudinary";

const ROOT_PHOTO_FOLDERS = ["analog", "digital"] as const;

function isPhotoFolderName(value: string): boolean {
  const [root, ...segments] = value.split("/");
  return (
    ROOT_PHOTO_FOLDERS.includes(root as (typeof ROOT_PHOTO_FOLDERS)[number]) &&
    segments.every((segment) => /^[a-zA-Z0-9_-]+$/.test(segment))
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const handler: Handler = async (event) => {
  try {
    const photosFolderName = event.queryStringParameters?.photosFolderName;

    if (photosFolderName !== undefined && !isPhotoFolderName(photosFolderName)) {
      return {
        statusCode: 400,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ err: "Invalid photo folder" }),
      };
    }

    const cursor = event.queryStringParameters?.cursor;
    const searchQuery = photosFolderName
      ? `(folder:${photosFolderName} OR folder:${photosFolderName}/*) AND resource_type:image`
      : "resource_type:image";
    const searchRequest = cloudinary.search
      .expression(searchQuery)
      .sort_by("public_id", "asc")
      .max_results(12);

    if (cursor) searchRequest.next_cursor(cursor);

    const searchResult = await searchRequest.execute();
    const photos = searchResult.resources.map(
      (file: { secure_url: string; public_id: string; width: number; height: number }) => ({
        url: file.secure_url,
        publicId: file.public_id,
        width: file.width,
        height: file.height,
      }),
    );
    return {
      statusCode: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photos, nextCursor: searchResult.next_cursor ?? null }),
    };
  } catch (err) {
    console.error("Cloudinary error: ", err);
    return {
      statusCode: 500,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ err: "Failed to fetch photos" }),
    };
  }
};
