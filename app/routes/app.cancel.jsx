import { redirect } from "@remix-run/node";
import { authenticate, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  const billingCheck = await billing.require({
    plans: [ANNUAL_PLAN],
    onFailure: () => {
      throw new Error("No active subscription found");
    },
  });

  const subscription = billingCheck.appSubscriptions[0];
  await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });

  return redirect("/app/pricing");
};
