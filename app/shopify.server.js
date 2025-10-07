import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
  BillingInterval,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-10";
import prisma from "./db.server";
import { ensureBlogPostToDateDefinitionExists } from "./app/routes/utils/shopify-metaobject.server";

export const MONTHLY_PLAN = 'Monthly subscription';
export const ANNUAL_PLAN = 'Annual subscription';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  isEmbeddedApp: true,
   billing: {
  [ANNUAL_PLAN]: {
    amount: 100,
    currencyCode: 'USD',
    interval: BillingInterval.Annual,
  },
  [MONTHLY_PLAN]: {
    amount: 10,
    currencyCode: 'USD',
    interval: BillingInterval.Every30Days,
  },
},
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ admin, session }) => {
       shopify.registerWebhooks({ session });
      try {
        const response = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
        const result = await response.json();
 
        const shopId = result?.data?.shop?.id;
        const activeSubs = result?.data?.currentAppInstallation?.activeSubscriptions || [];
 
        let planName = "Free";
        if (Array.isArray(activeSubs) && activeSubs.length > 0) {
          planName = activeSubs[0].name || "Free";
        }
 
        const metafieldResponse = await admin.graphql(METAFIELDS_SET_MUTATION, {
          variables: {
            metafields: [
              {
                namespace: "blog_settings",
                key: "plan_name",
                type: "single_line_text_field",
                value: planName,
                ownerId: shopId,
              }
            ]
          }
        });
        const metafieldResult = await metafieldResponse.json();
        console.log("Metafield set result:", metafieldResult.data.metafieldsSet.metafields);
 
      } catch (err) {
        console.error("afterAuth error:", err);
      }
    }
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
