import { apiVersion } from "../config.js";

export class ShopifyClient {
  constructor(accessToken, storeDomain) {
    this.baseUrl = `https://${storeDomain}/admin/api/${apiVersion}`;
    this.headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    };
  }

  async query({ query, variables }) {
    const response = await fetch(`${this.baseUrl}/graphql.json`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`
      );
    }

    return result.data;
  }
}