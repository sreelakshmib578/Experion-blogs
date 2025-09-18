import { useEffect, useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  InlineStack,
  Select,
  ChoiceList,
  Button,
  Divider,
  Banner,
} from "@shopify/polaris";
import {
  useLoaderData,
  useNavigation,
  useActionData,
  useRevalidator,
  Form,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate, ANNUAL_PLAN } from "../shopify.server";
import { saveFeaturedTagsMetafield } from "./utils/shopify-metaobject.server";
import { ensureBlogPostToDateDefinitionExists } from "./utils/shopify-todate.server";


export const loader = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  let hasPayment = true;
  try {
    await billing.require({
      plans: [ANNUAL_PLAN],
      onFailure: async () => {
        hasPayment = false;
      },
    });
  } catch {
    hasPayment = false;
  }

  const blogs = [];
  if (hasPayment) {
    const blogQuery = `#graphql
      {
        blogs(first: 10) {
          edges {
            node {
              id
              title
              metafield(namespace: "blog_filtering", key: "featured_tags") {
                value
              }
            }
          }
        }
      }
    `;

    const blogRes = await admin.graphql(blogQuery);
    const blogData = await blogRes.json();
    const blogEdges = blogData?.data?.blogs?.edges ?? [];

    for (const { node: blog } of blogEdges) {
      let articles = [];
      let hasNextPage = true;
      let endCursor = null;

      while (hasNextPage) {
        const articleQuery = `#graphql
          query getArticles($blogId: ID!, $cursor: String) {
            blog(id: $blogId) {
              articles(first: 100, after: $cursor) {
                edges {
                  node {
                    title
                    tags
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `;

        const variables = { blogId: blog.id, cursor: endCursor };
        const res = await admin.graphql(articleQuery, { variables });
        const data = await res.json();
        const articleEdges = data?.data?.blog?.articles?.edges ?? [];

        articles.push(...articleEdges.map((edge) => edge.node));
        hasNextPage = data?.data?.blog?.articles?.pageInfo?.hasNextPage;
        endCursor = data?.data?.blog?.articles?.pageInfo?.endCursor;
        try {
          await ensureBlogPostToDateDefinitionExists(admin);
        } catch (err) {
          console.error("Failed to ensure metafield definition:", err);
        }
      }

      let featuredTags = [];
      try {
        featuredTags = JSON.parse(blog.metafield?.value ?? "[]");
      } catch { }

      blogs.push({
        id: blog.id,
        title: blog.title,
        featuredTags,
        articles,
      });
    }
  }

  return json({ blogs, shop, hasPayment });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const blogId = formData.get("blogId");
  const featuredTags = formData.getAll("featuredTags[]");

  if (!blogId) {
    return json({ error: "Please select a blog and at least one tag" }, { status: 400 });
  }

  try {
    const saved = await saveFeaturedTagsMetafield(admin, blogId, featuredTags);
    return json({ success: true, saved });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};

export default function Index() {
  const loaderData = useLoaderData() || {};
  const { blogs = [], shop, hasPayment } = loaderData;
  const actionData = useActionData();
  const [localSuccess, setLocalSuccess] = useState(false);
  const navigation = useNavigation();
  const { revalidate } = useRevalidator();
  const storeSlug = shop?.replace(".myshopify.com", "") || "";

  const [selectedBlogId, setSelectedBlogId] = useState(blogs?.[0]?.id ?? "");
  const selectedBlog = blogs.find((b) => b.id === selectedBlogId);

  const [selectedFeaturedTags, setSelectedFeaturedTags] = useState([]);
  const [tagList, setTagList] = useState([]);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      setLocalSuccess(true);
    }
  }, [actionData]);

  useEffect(() => {
    if (!selectedBlog) return;

    const tagSet = new Set();
    selectedBlog?.articles?.forEach((article) => article.tags.forEach((tag) => tagSet.add(tag)));
    const allTags = Array.from(tagSet).sort();

    setTagList(allTags);
    setLocalSuccess(false);
    setSelectedFeaturedTags(selectedBlog?.featuredTags ?? []);
  }, [selectedBlogId, blogs]);

  const handleBlogChange = useCallback((value) => {
    setSelectedBlogId(value);
  }, []);

  const shopifyAdminURL = `https://admin.shopify.com/store/${storeSlug}/content/articles?blog_title=${encodeURIComponent(selectedBlog?.title || "")}`;

  return (
    <Page>
      <TitleBar title="Experion Blog App" />

      {!hasPayment && (
        <Box padding="400">
          <Banner status="critical" title="Subscription Required">
            <p>
              To use this feature, you need an active subscription plan.
              <br />
              <a href="/app/pricing" style={{ fontWeight: "bold" }}>
                Go to Pricing Page
              </a>
            </p>
          </Banner>
        </Box>
      )}

      {hasPayment && (
        <BlockStack gap="500">
          <Layout>
            <Layout.Section oneThird>
              <Card title="Blog Settings" sectioned>
                <Box paddingBlockEnd="300">
                  <Text as="h2" variant="headingMd">
                    Featured Tags
                  </Text>
                  <Divider />
                </Box>
                <Form method="post">
                  <input type="hidden" name="blogId" value={selectedBlogId} />
                  {selectedFeaturedTags.map((tag) => (
                    <input key={tag} type="hidden" name="featuredTags[]" value={tag} />
                  ))}

                  <BlockStack gap="400">
                    <Select
                      label="Select Blog"
                      options={blogs.map((b) => ({
                        label: b.title,
                        value: b.id,
                      }))}
                      value={selectedBlogId}
                      onChange={handleBlogChange}
                    />
                    {tagList.length > 0 ? (
                      <>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            Select Tags to Feature
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" fontSize="bodySm" color="subdued">
                              Select the tags you want to highlight as{" "}
                              <strong>featured</strong> for this blog. These tags will be used to pin or spotlight articles.
                            </Text>
                          </Box>
                          <ChoiceList
                            allowMultiple
                            choices={tagList.map((tag) => ({ label: tag, value: tag }))}
                            selected={selectedFeaturedTags}
                            onChange={setSelectedFeaturedTags}
                            name="featuredTags[]"
                          />
                          <Box paddingBlockStart="200">
                            <Text as="p" fontSize="bodySm" color="subdued">
                              After selecting or deselecting tags, click <strong>Save</strong> to update the blog's featured tags.
                            </Text>
                          </Box>

                          <Button submit loading={isSubmitting} primary>
                            Save Featured Tags
                          </Button>
                        </BlockStack>
                      </>
                    ) : (
                      <Banner status="info" title="No tags available for this blog.">
                        <p>
                          To feature tags, first create articles with tags in this blog or select another blog from the dropdown.{" "}
                          <a href={shopifyAdminURL} target="_blank" rel="noopener noreferrer">
                            Go to Shopify admin blogs to add tags
                          </a>
                          .
                        </p>
                      </Banner>
                    )}

                    {actionData?.error && (
                      <Banner status="critical" title="Error">
                        {actionData.error}
                      </Banner>
                    )}
                    {localSuccess && (
                      <Banner status="success" title="Success">
                        Featured tags saved successfully!
                      </Banner>
                    )}
                  </BlockStack>
                </Form>
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Card title="Currently Featured Tags" sectioned>
                {selectedFeaturedTags.length > 0 ? (
                  <InlineStack wrap spacing="300">
                    {selectedFeaturedTags.map((tag) => (
                      <Box
                        key={tag}
                        background="bg-fill-highlight"
                        padding="200"
                        borderRadius="300"
                        border="base"
                      >
                        <Text fontWeight="medium">{tag}</Text>
                      </Box>
                    ))}
                  </InlineStack>
                ) : (
                  <Text color="subdued">No featured tags selected.</Text>
                )}
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      )}
    </Page>
  );
}
