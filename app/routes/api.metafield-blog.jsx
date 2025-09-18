import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const blogId = url.searchParams.get("blogId");
  if (!blogId) return json({ error: "Missing blog ID" }, { status: 400 });

  const { admin } = await authenticate.admin(request);

  const query = `#graphql
    query GetBlogMetafield($id: ID!) {
      blog(id: $id) {
        metafield(namespace: "blog_filtering", key: "featured_tags") {
          value
        }
      }
    }
  `;

  const res = await admin.graphql(query, {
    variables: { id: blogId },
  });

  const jsonData = await res.json();

  let featuredTags = [];
  try {
    featuredTags = JSON.parse(jsonData?.data?.blog?.metafield?.value || "[]");
  } catch {}

  return json({ featuredTags });
};