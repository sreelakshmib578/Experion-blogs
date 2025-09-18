export async function ensureFeaturedTagsDefinitionExists(admin) {
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
      name: "Featured Tags",
      namespace: "blog_filtering",
      key: "featured_tags",
      type: "list.single_line_text_field",
      ownerType: "BLOG",
      description: "Tags to be highlighted or pinned for filtering"
    }
  };

  const res = await admin.graphql(mutation, { variables });
  const json = await res.json();

  console.log('Metafield Definition Result:', JSON.stringify(json, null, 2));

  const errors = json?.data?.metafieldDefinitionCreate?.userErrors || [];

  if (errors.length > 0) {
    const alreadyExists = errors.some((e) =>
      e.message?.toLowerCase().includes("key is in use") ||
      e.message?.toLowerCase().includes("already exists") ||
      e.message?.toLowerCase().includes("already been taken")
    );

    if (alreadyExists) {
      console.log("Metafield definition already exists.");
      return true;
    }

    throw new Error("Metafield definition creation failed: " + errors[0].message);
  }

  return true;
}

export async function saveFeaturedTagsMetafield(admin, blogId, tags) {
  
  await ensureFeaturedTagsDefinitionExists(admin);
  console.log("Blog ID:", blogId);

  const mutation = `#graphql
    mutation SetMetafield($input: MetafieldsSetInput!) {
      metafieldsSet(metafields: [$input]) {
        metafields {
          id
          namespace
          key
          value
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  console.log(tags);
  const variables = {
    input: {
      ownerId: `${blogId}`,
      namespace: "blog_filtering",
      key: "featured_tags",
      type: "list.single_line_text_field",
     value: JSON.stringify(tags),
    },
  };

  console.log(
    "Setting Metafield Variables:",
    JSON.stringify(variables, null, 2),
  );

  const res = await admin.graphql(mutation, { variables });
  const json = await res.json();

  console.log("Metafield Set Result:", JSON.stringify(json, null, 2));

  const errors = json?.data?.metafieldsSet?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(
      "Failed to save featured tags: " +
        errors.map((e) => e.message).join(", "),
    );
  }

  const metafield = json?.data?.metafieldsSet?.metafields?.[0];
  if (!metafield?.id) {
    throw new Error("Metafield was not created - no ID returned");
  }

  return metafield;
}