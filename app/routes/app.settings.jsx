import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Box,
  InlineStack,
  Divider,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const storeSlug = shop?.replace(".myshopify.com", "") || "";
  const themeEditorUrl = `https://admin.shopify.com/store/${storeSlug}/themes/current/editor?template=blog`;

  return json({ themeEditorUrl });
};

export default function Settings() {
  const { themeEditorUrl } = useLoaderData();

  return (
    <Page>
      <TitleBar title="Settings" />
      <Box paddingBlockStart="400">
        <Layout paddingBlockEnd="400">
          <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Blog Section
                </Text>
                <Text color="subdued">
                  Enable custom blog section on your storefront.
                </Text>
              </BlockStack>
          </Layout.Section>
          <Layout.Section variant="twoThirds">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingSm" as="h3">
                  Configuration
                </Text>
                <Divider />
                <Text variant="bodyMd">
                  To enable the custom blog section on your storefront:
                </Text>
                <List type="bullet" gap="loose">
                  <List.Item>Open the theme editor using the button below</List.Item>
                  <List.Item>Switch to the <strong>blog</strong> template</List.Item>
                  <List.Item>Hide the existing <strong>blog posts </strong>section by clicking the 👁️ icon</List.Item>
                  <List.Item>Click Add Section and Add the <strong>Blog Filter block</strong>  from the "Apps" section</List.Item>
                </List>
                <Divider />
                <InlineStack align="start">
                  <Button url={themeEditorUrl} target="_blank" external primary>
                    Go to Blog Theme Editor
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        <Layout paddingBlockStart="400">
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Billing & Subscription
              </Text>
              <Text color="subdued">
                Manage your subscription and billing details for the Experion Blog App.
              </Text>
            </BlockStack>
          </Layout.Section>
          <Layout.Section variant="twoThirds">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingSm" as="h3">
                  Subscription Details
                </Text>
                <Divider />
                <Text variant="bodyMd">
                  Your current subscription plan is <strong>Basic</strong>. You can upgrade to access more features and support.
                </Text>
                <Text variant="bodyMd">
                  For billing inquiries or to change your plan, please contact our support team.
                </Text>
                <Divider />
                <InlineStack align="start">
                  <Button url="https://experion.co/contact" target="_blank" external primary>
                    Contact Support
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Box>
    </Page>
  );
}