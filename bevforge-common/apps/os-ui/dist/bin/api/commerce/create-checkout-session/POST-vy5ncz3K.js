import { existsSync, readFileSync } from 'node:fs';

const USER_AGENT = "GoDaddy-Airo-AppBuilder App Commerce-Checkout v1";
function deriveCheckoutUrl(apiBaseUrl) {
  try {
    const apiUrl = new URL(apiBaseUrl);
    const newHostname = `checkout.commerce.${apiUrl.hostname}`;
    return `${apiUrl.protocol}//${newHostname}`;
  } catch (error) {
    throw new Error(
      `Failed to derive checkout URL from GODADDY_API_BASE_URL: ${apiBaseUrl}`
    );
  }
}
function getCommerceConfig() {
  const allocConfigPath = "/alloc/config.json";
  if (!existsSync(allocConfigPath)) {
    throw new Error(
      "Commerce configuration not found. Missing /alloc/config.json with OAuth credentials."
    );
  }
  let clientId;
  let clientSecret;
  try {
    const allocConfig = JSON.parse(readFileSync(allocConfigPath, "utf-8"));
    clientId = allocConfig.GODADDY_OAUTH_CLIENT_ID?.VALUE;
    clientSecret = allocConfig.GODADDY_OAUTH_CLIENT_SECRET?.VALUE;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse ${allocConfigPath}: Invalid JSON format`
      );
    }
    throw error;
  }
  const apiBaseUrl = process.env.GODADDY_API_BASE_URL;
  const missingFields = [];
  if (!clientId) missingFields.push("GODADDY_OAUTH_CLIENT_ID");
  if (!clientSecret) missingFields.push("GODADDY_OAUTH_CLIENT_SECRET");
  if (!apiBaseUrl) missingFields.push("GODADDY_API_BASE_URL (env var)");
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Commerce credentials: ${missingFields.join(", ")}`
    );
  }
  const checkoutApiBaseUrl = deriveCheckoutUrl(apiBaseUrl);
  return {
    clientId,
    clientSecret,
    apiBaseUrl,
    checkoutApiBaseUrl
  };
}
let cachedCommerceConfig = null;
function getCommerceConfigCached() {
  if (!cachedCommerceConfig) {
    cachedCommerceConfig = getCommerceConfig();
  }
  return cachedCommerceConfig;
}
function transformUrlsForCommerce(returnUrl, successUrl) {
  let finalReturnUrl = returnUrl;
  let finalSuccessUrl = successUrl;
  if (returnUrl.includes("localhost")) {
    finalReturnUrl = returnUrl.replace(/localhost/, "success.preview.dev-godaddy.com").replace(/^https:\/\//, "http://");
  } else if (returnUrl.startsWith("https://")) {
    finalReturnUrl = returnUrl.replace(/^https:\/\//, "http://");
  }
  if (successUrl.includes("localhost")) {
    finalSuccessUrl = successUrl.replace(/localhost/, "success.preview.dev-godaddy.com").replace(/^https:\/\//, "http://");
  } else if (successUrl.startsWith("https://")) {
    finalSuccessUrl = successUrl.replace(/^https:\/\//, "http://");
  }
  return { returnUrl: finalReturnUrl, successUrl: finalSuccessUrl };
}
async function getAccessToken() {
  const config = getCommerceConfigCached();
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  const apiBaseUrl = config.apiBaseUrl;
  const tokenUrl = `${apiBaseUrl}/v2/oauth2/token`;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required Commerce credentials (CLIENT_ID or CLIENT_SECRET)"
    );
  }
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "commerce.product:read"
  });
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT
      },
      body: params.toString()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OAuth token request failed: ${response.status} - ${errorText}`
      );
    }
    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    throw error;
  }
}
async function createCheckoutSession(accessToken, params) {
  const config = getCommerceConfigCached();
  const checkoutApiBaseUrl = config.checkoutApiBaseUrl;
  if (!params.storeId) {
    throw new Error("Missing required Commerce STORE_ID");
  }
  const baseInput = {
    environment: "dev",
    storeId: params.storeId,
    storeName: params.storeName ?? null,
    customerId: null,
    returnUrl: params.returnUrl,
    successUrl: params.successUrl,
    enableShipping: params.enableShipping ?? false,
    enableLocalPickup: params.enableLocalPickup ?? false,
    enableBillingAddressCollection: params.enableBillingAddressCollection ?? true,
    enableShippingAddressCollection: params.enableShippingAddressCollection ?? false,
    enablePhoneCollection: params.enablePhoneCollection ?? false,
    enableTaxCollection: params.enableTaxCollection ?? false,
    enablePaymentMethodCollection: params.enablePaymentMethodCollection ?? true,
    paymentMethods: {
      card: {
        processor: "godaddy",
        checkoutTypes: ["standard"]
      }
    }
  };
  const input = params.draftOrderId ? { ...baseInput, draftOrderId: params.draftOrderId } : { ...baseInput, lineItems: params.lineItems };
  const graphqlQuery = {
    query: `
			mutation CreateCheckoutSession($input: MutationCreateCheckoutSessionInput!) {
				createCheckoutSession(input: $input) {
					id
					storeId
          businessId
					url
				}
			}
		`,
    variables: { input }
  };
  try {
    const response = await fetch(checkoutApiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": USER_AGENT
      },
      body: JSON.stringify(graphqlQuery)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GraphQL request failed: ${response.status} - ${errorText}`
      );
    }
    const graphqlData = await response.json();
    if (graphqlData.errors?.length) {
      const errorMessages = graphqlData.errors.map((e) => e.message).join(", ");
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }
    if (!graphqlData.data?.createCheckoutSession) {
      throw new Error("No checkout session data returned from API");
    }
    return graphqlData.data.createCheckoutSession;
  } catch (error) {
    throw error;
  }
}
async function handler(req, res) {
  try {
    const {
      storeId,
      returnUrl,
      successUrl,
      lineItems,
      draftOrderId,
      storeName,
      enableShipping,
      enableLocalPickup,
      enableBillingAddressCollection,
      enableShippingAddressCollection,
      enablePhoneCollection,
      enableTaxCollection,
      enablePaymentMethodCollection
    } = req.body;
    const hasLineItems = lineItems && lineItems.length > 0;
    const hasDraftOrderId = !!draftOrderId;
    if (!returnUrl || !successUrl || !storeId) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: storeId, returnUrl, successUrl"
      });
      return;
    }
    if (!hasLineItems && !hasDraftOrderId) {
      res.status(400).json({
        success: false,
        error: "Must provide either lineItems or draftOrderId"
      });
      return;
    }
    const { returnUrl: finalReturnUrl, successUrl: finalSuccessUrl } = transformUrlsForCommerce(returnUrl, successUrl);
    const accessToken = await getAccessToken();
    const checkoutSession = await createCheckoutSession(accessToken, {
      storeId,
      lineItems,
      draftOrderId,
      returnUrl: finalReturnUrl,
      successUrl: finalSuccessUrl,
      storeName,
      enableShipping,
      enableLocalPickup,
      enableBillingAddressCollection,
      enableShippingAddressCollection,
      enablePhoneCollection,
      enableTaxCollection,
      enablePaymentMethodCollection
    });
    res.json({
      success: true,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      storeId: checkoutSession.storeId
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

export { handler as h };
