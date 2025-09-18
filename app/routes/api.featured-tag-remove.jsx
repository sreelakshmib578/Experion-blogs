import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { saveFeaturedTagsMetafield } from "./utils/shopify-metaobject.server.js";


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const blogId = formData.get("blogId");
  const tagToRemove = formData.get("tag");

  if (!blogId || !tagToRemove) {
    return json({ error: "Missing blog ID or tag" }, { status: 400 });
  }

  try {
    const getQuery = `#graphql
      query getFeaturedTags($id: ID!) {
        blog(id: $id) {
          metafield(namespace: "blog_filtering", key: "featured_tags") {
            value
          }
        }
      }
    `;

    const result = await admin.graphql(getQuery, {
      variables: { id: blogId },
    });

    const currentTags = JSON.parse(
      result?.data?.blog?.metafield?.value ?? "[]"
    );

    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove);
    await saveFeaturedTagsMetafield(admin, blogId, updatedTags);

    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};