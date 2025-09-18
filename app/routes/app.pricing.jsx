import {
  Page,
  Box,
  Button,
  Card,
  CalloutCard,
  Text,
  Grid,
  Divider,
  BlockStack,
  ExceptionList,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { PLANS_UI } from "./utils/plans";
const ANNUAL_PLAN = "Annual subscription";

export async function loader({ request }) {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.check({ plans: [ANNUAL_PLAN] });
  const subscription = billingCheck.appSubscriptions[0];

  if (subscription) {
    return json({ plan: subscription });
  }

  return json({ plan: { name: "Free" } });
}

export default function PricingPage() {
  const { plan } = useLoaderData();

  return (
    <Page>
      <ui-title-bar title="Pricing" />
      <CalloutCard
        title="Your current plan"
        illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
        primaryAction={{
          content: plan.name !== "Free" ? "Cancel Plan" : "Upgrade Now",
          url:
            plan.name !== "Free"
              ? "/app/cancel"
              : `/app/upgrade?plan=${encodeURIComponent(ANNUAL_PLAN)}`,
        }}
      >
        {plan.name !== "Free" ? (
          <p>
            You're currently on the <strong>{plan.name}</strong> plan. All
            features are unlocked.
          </p>
        ) : (
          <p>
            You're currently on the <strong>Free</strong> plan. Upgrade to
            unlock advanced features.
          </p>
        )}
      </CalloutCard>

      <Divider style={{ margin: "1rem 0" }} />

      <Grid>
        {/* Free Plan */}
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <Card sectioned>
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                {PLANS_UI.FREE.name}
              </Text>
              <Box as="p" variant="bodyMd">
                {PLANS_UI.FREE.description}
                <br />
                <Text as="p" variant="headingLg" fontWeight="bold">
                  Free
                </Text>
              </Box>
              <Divider style={{ margin: "0.5rem 0" }} />
              <BlockStack gap={100}>
                {PLANS_UI.FREE.features.map((feature, i) => (
                  <ExceptionList key={i} items={[{ description: feature }]} />
                ))}
              </BlockStack>
            </Box>
          </Card>
        </Grid.Cell>

        {/* Annual Plan */}
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <Card
            background={
              plan.name === ANNUAL_PLAN ? "bg-surface-success" : "bg-surface"
            }
            sectioned
          >
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                {PLANS_UI.ANNUAL.name}
              </Text>
              <Box as="p" variant="bodyMd">
                {PLANS_UI.ANNUAL.description}
                <br />
                <Text as="p" variant="headingLg" fontWeight="bold">
                  ${PLANS_UI.ANNUAL.price}
                </Text>
              </Box>
              <Divider style={{ margin: "0.5rem 0" }} />
              <BlockStack gap={100}>
                {PLANS_UI.ANNUAL.features.map((feature, i) => (
                  <ExceptionList key={i} items={[{ description: feature }]} />
                ))}
              </BlockStack>
              <Divider style={{ margin: "0.5rem 0" }} />
              {plan.name !== ANNUAL_PLAN ? (
                <Button
                  primary
                  url={`/app/upgrade?plan=${encodeURIComponent(ANNUAL_PLAN)}`}
                >
                  Upgrade Now
                </Button>
              ) : (
                <Text as="p" variant="bodyMd">
                  You're currently on this plan
                </Text>
              )}
            </Box>
          </Card>
        </Grid.Cell>
      </Grid>
    </Page>
  );
}
