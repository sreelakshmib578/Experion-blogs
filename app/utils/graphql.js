export const METAFIELDS_SET_MUTATION = `#graphql
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { message }
    }
  }
`;

export const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
  query {
    currentAppInstallation {
      activeSubscriptions {
        name
        status
      }
    }
    shop {
      id
    }
  }
`;