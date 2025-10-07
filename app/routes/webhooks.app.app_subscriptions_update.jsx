
import { authenticate } from "../shopify.server";
import { ShopifyClient } from "../utils/client";
import { METAFIELDS_SET_MUTATION, ACTIVE_SUBSCRIPTIONS_QUERY } from "../utils/graphql";
 
const clientQuery = async (client, query, variables) => {
  try {
    return await client.query({ query, variables });
  } catch (error) {
    console.error("[Shopify Query Error]:", error);
    throw error;
  }
};
 
export const action = async ({ request }) => {
  try {
    const { shop, topic, session } = await authenticate.webhook(request);
    const client = new ShopifyClient(session.accessToken, shop);
 
    console.log(`Received ${topic} webhook for ${shop}`);
 
    const activeSubsResult = await clientQuery(client, ACTIVE_SUBSCRIPTIONS_QUERY);
    const shopId = activeSubsResult.shop.id;
    const activeSubs = activeSubsResult.currentAppInstallation.activeSubscriptions || [];
 
    let metafieldPlanName = "Free";
 
    const activePaidSub = activeSubs.find(sub =>
      sub.name === "Monthly subscription" || sub.name === "Annual subscription"
    );
 
    if (activePaidSub) {
      metafieldPlanName = activePaidSub.name;
    }
 
    const metafieldsToSet = [
      {
        namespace: "blog_settings",
        key: "plan_name",
        type: "single_line_text_field",
        value: metafieldPlanName,
        ownerId: shopId,
      }
    ];
 
    const setResponse = await clientQuery(client, METAFIELDS_SET_MUTATION, { metafields: metafieldsToSet });
 
    if (setResponse?.metafieldsSet?.userErrors?.length) {
      console.error("Metafield save errors:", setResponse.metafieldsSet.userErrors);
    } else {
      console.log(`Metafield updated for ${shop}: ${metafieldPlanName}`);
    }
 
    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Billing webhook error:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
 