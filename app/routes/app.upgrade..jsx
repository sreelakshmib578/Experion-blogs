import { redirect } from "@remix-run/node";
import { authenticate,ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const myShop = shop.replace(".myshopify.com", "");

  const confirmationUrl = await billing.require({
    plans: [ANNUAL_PLAN],
    onFailure: async () => {
      return billing.request({
        plan: ANNUAL_PLAN,
        isTest: process.env.NODE_ENV !== "production",
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
      });
    },
  });

  if (confirmationUrl) {
    return redirect(confirmationUrl);
  }

  return redirect("/app/pricing");
};
