import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateApiKey } from "../lib/auth";
import { saveIntegration, getIntegration, disconnectIntegration, getTenantIntegrations, IntegrationType } from "../shared/integrationsStore";
import { randomUUID } from "crypto";

// OAuth configuration for Discord only
const OAUTH_CONFIG = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: "webhook.incoming",
  },
};

// Discord OAuth callback URL - should match what's configured in Discord app
const DISCORD_CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || "https://www.webhookmonitor.shop/oauth/callback/discord";
const REDIRECT_BASE_URL = process.env.OAUTH_REDIRECT_BASE_URL || process.env.VITE_API_BASE_URL || "https://webhook-monitor-func.azurewebsites.net";

/**
 * Initiate OAuth flow for Discord integration
 */
app.http("integrationsOAuth", {
  route: "integrations/{integrationType}/oauth",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    if (!apiKey) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const keyInfo = await authenticateApiKey(apiKey, req, "/api/integrations/oauth");
    if (!keyInfo) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const integrationType = (req.params as any)["integrationType"] as string | undefined;
    if (!integrationType || integrationType !== 'discord') {
      return { status: 400, jsonBody: { error: "Only Discord integration is currently supported" } };
    }

    const config = OAUTH_CONFIG.discord;
    if (!config.clientId || !config.clientSecret) {
      return {
        status: 500,
        jsonBody: {
          error: "Discord OAuth not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables.",
        },
      };
    }

    // Generate state token for CSRF protection (include tenantId for callback)
    const state = randomUUID();
    // Include tenantId in state for callback verification
    const stateWithTenant = `${state}:${keyInfo.tenantId}`;
    // Use the Discord callback URL configured in Discord app
    const callbackUrl = integrationType === 'discord' 
      ? `${DISCORD_CALLBACK_URL}?state=${encodeURIComponent(stateWithTenant)}`
      : `${REDIRECT_BASE_URL}/api/integrations/${integrationType}/callback?state=${encodeURIComponent(stateWithTenant)}`;

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: config.scopes,
      state: state,
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;

    return {
      status: 302,
      headers: {
        Location: authUrl,
      },
    };
  },
});

/**
 * Handle OAuth callback
 */
// Discord OAuth callback handler - matches Discord app redirect URL
app.http("integrationsOAuthCallback", {
  route: "oauth/callback/{integrationType}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const integrationType = (req.params as any)["integrationType"] as string | undefined;
    const code = req.query.get("code");
    const stateParam = req.query.get("state");
    const error = req.query.get("error");

    if (error) {
      return {
        status: 400,
        body: `OAuth error: ${error}. Please try again.`,
      };
    }

    if (!code || !stateParam || !integrationType || integrationType !== 'discord') {
      return {
        status: 400,
        body: "Missing code, state, or invalid integration type",
      };
    }

    // Extract tenantId from state (format: "state:tenantId")
    const [state, tenantId] = stateParam.split(':');
    if (!tenantId) {
      return {
        status: 400,
        body: "Invalid state parameter",
      };
    }

    const config = OAUTH_CONFIG.discord;
    if (!config.clientId || !config.clientSecret) {
      return {
        status: 500,
        body: "OAuth not configured for Discord",
      };
    }

    try {
      // Exchange code for access token - use the same callback URL as in OAuth initiation
      const callbackUrl = integrationType === 'discord'
        ? DISCORD_CALLBACK_URL
        : `${REDIRECT_BASE_URL}/api/integrations/${integrationType}/callback`;
      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        context.log(`OAuth token exchange failed: ${errorText}`);
        return {
          status: 400,
          body: `Failed to exchange OAuth code: ${errorText}`,
        };
      }

      const tokenData: any = await tokenResponse.json();

      // Save integration connection
      const integration: any = {
        partitionKey: tenantId,
        rowKey: integrationType,
        integrationType: integrationType as IntegrationType,
        connectedAt: new Date().toISOString(),
        active: true,
      };

      // Store Discord tokens and webhook info
      integration.accessToken = tokenData.access_token;
      integration.refreshToken = tokenData.refresh_token;
      integration.webhookUrl = tokenData.webhook?.url;
      integration.channelId = tokenData.webhook?.channel_id;

      await saveIntegration(integration);

      // Redirect to success page (frontend)
      const frontendUrl = process.env.FRONTEND_URL || "https://webhookmonitor.shop";
      return {
        status: 302,
        headers: {
          Location: `${frontendUrl}/dashboard?integration=${integrationType}&status=connected`,
        },
      };
    } catch (err: any) {
      context.log(`OAuth callback error:`, err);
      return {
        status: 500,
        body: `Failed to complete OAuth flow: ${err.message}`,
      };
    }
  },
});

/**
 * Get user's integrations
 */
app.http("integrationsList", {
  route: "integrations",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    if (!apiKey) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const keyInfo = await authenticateApiKey(apiKey, req, "/api/integrations");
    if (!keyInfo) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const integrations = await getTenantIntegrations(keyInfo.tenantId);

    return {
      status: 200,
      jsonBody: {
        integrations: integrations.map((i) => ({
          type: i.integrationType,
          connectedAt: i.connectedAt,
          active: i.active,
          // Don't expose tokens
        })),
      },
    };
  },
});

/**
 * Disconnect an integration
 */
app.http("integrationsDisconnect", {
  route: "integrations/{integrationType}/disconnect",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    if (!apiKey) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const keyInfo = await authenticateApiKey(apiKey, req, "/api/integrations/disconnect");
    if (!keyInfo) {
      return { status: 401, body: "Invalid or missing API key" };
    }

    const integrationType = (req.params as any)["integrationType"] as string | undefined;
    if (!integrationType || integrationType !== 'discord') {
      return { status: 400, jsonBody: { error: "Only Discord integration is currently supported" } };
    }

    await disconnectIntegration(keyInfo.tenantId, integrationType as IntegrationType);

    return {
      status: 200,
      jsonBody: { success: true, message: `${integrationType} disconnected` },
    };
  },
});
