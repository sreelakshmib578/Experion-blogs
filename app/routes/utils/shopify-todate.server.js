export async function ensureBlogPostToDateDefinitionExists(admin) {
  const mutation = `#graphql
    mutation CreateDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          namespace
          key
          ownerType
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    definition: {
      name: "Schedule the last date",
      namespace: "custom",
      key: "to_date",
      type: "date_time",
      ownerType: "ARTICLE",
      description: "The last date/time until this blog post is scheduled.",
    },
  };

  const res = await admin.graphql(mutation, { variables });

  // 🔧 Handle both cases: Response object (needs .json) OR plain JSON
  const json = typeof res.json === "function" ? await res.json() : res;

  console.log(
    "Blog Post Metafield Definition Result:",
    JSON.stringify(json, null, 2),
  );

  const errors = json?.data?.metafieldDefinitionCreate?.userErrors || [];

  if (errors.length > 0) {
    const alreadyExists = errors.some((e) =>
      e.message?.toLowerCase().includes("key is in use") ||
      e.message?.toLowerCase().includes("already exists") ||
      e.message?.toLowerCase().includes("already been taken"),
    );

    if (alreadyExists) {
      console.log("Blog post metafield definition already exists.");
      return true;
    }

    throw new Error(
      "Blog post metafield definition creation failed: " + errors[0].message,
    );
  }

  return true;
}
