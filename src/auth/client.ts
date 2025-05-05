import { OAuth2Client, Credentials } from 'google-auth-library';
import * as fs from 'fs/promises';
import { getKeysFilePath } from './utils.js';

export async function initializeOAuth2Client(options?: {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<OAuth2Client> {
  // Use environment variables or provided options if available
  const envClientId = options?.clientId || process.env.CLIENT_ID;
  const envClientSecret = options?.clientSecret || process.env.CLIENT_SECRET;
  const envRedirectUri = options?.redirectUri || process.env.REDIRECT_URI;
  const envAccessToken = options?.accessToken || process.env.ACCESS_TOKEN;
  const envRefreshToken = options?.refreshToken || process.env.REFRESH_TOKEN;

  // Check if we have all required environment variables for direct auth
  const hasEnvCredentials = envClientId && envClientSecret && envRedirectUri;
  
  try {
    let oauth2Client: OAuth2Client;
    
    if (hasEnvCredentials) {
      // Initialize OAuth client with environment variables
      oauth2Client = new OAuth2Client({
        clientId: envClientId,
        clientSecret: envClientSecret,
        redirectUri: envRedirectUri,
      });
      
      // Set tokens if available
      if (envAccessToken) {
        const tokens: Credentials = {
          access_token: envAccessToken,
          refresh_token: envRefreshToken,
        };
        oauth2Client.setCredentials(tokens);
      }
      
      return oauth2Client;
    } else {
      // Fall back to reading from the keys file
      const keysContent = await fs.readFile(getKeysFilePath(), "utf-8");
      const keys = JSON.parse(keysContent);

      const { client_id, client_secret, redirect_uris } = keys.installed;

      // Use the first redirect URI as the default for the base client
      return new OAuth2Client({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uris[0], 
      });
    }
  } catch (error) {
    throw new Error(`Error initializing OAuth client: ${error instanceof Error ? error.message : error}`);
  }
}

export async function loadCredentials(): Promise<{ client_id: string; client_secret: string }> {
  // Use environment variables if available
  const envClientId = process.env.CLIENT_ID;
  const envClientSecret = process.env.CLIENT_SECRET;
  
  if (envClientId && envClientSecret) {
    return { client_id: envClientId, client_secret: envClientSecret };
  }
  
  // Fall back to reading from the keys file
  try {
    const keysContent = await fs.readFile(getKeysFilePath(), "utf-8");
    const keys = JSON.parse(keysContent);
    const { client_id, client_secret } = keys.installed;
    if (!client_id || !client_secret) {
        throw new Error('Client ID or Client Secret missing in keys file.');
    }
    return { client_id, client_secret };
  } catch (error) {
    throw new Error(`Error loading credentials: ${error instanceof Error ? error.message : error}`);
  }
} 