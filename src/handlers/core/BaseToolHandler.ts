import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { calendar_v3, google } from "googleapis";

// Type guard for Google API errors
interface GoogleApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}


export abstract class BaseToolHandler {
    /**
     * Runs the tool with the given arguments and OAuth2 client.
     * 
     * @param args The arguments to pass to the tool.
     * @param oauth2Client The OAuth2 client to use for authentication.
     * @returns A promise that resolves to the result of the tool.
     */
    abstract runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult>;

    /**
     * Handles a Google API error.
     * 
     * @param error The error to handle.
     */
    protected handleGoogleApiError(error: unknown): void {
        // Check if error is a GoogleApiError with invalid_grant
        if (this.isGoogleApiError(error) && error.response?.data?.error === 'invalid_grant') {
            throw new Error(
                'Google API Error: Authentication token is invalid or expired. Please re-run the authentication process (e.g., `npm run auth`).'
            );
        }
        throw error;
    }

    /**
     * Helper function to check if an error is a Google API error.
     * 
     * @param error The error to check.
     * @returns True if the error is a Google API error, false otherwise.
     */
    protected isGoogleApiError(error: unknown): error is GoogleApiError {
      return typeof error === 'object' && 
             error !== null && 
             'response' in error && 
             typeof error.response === 'object' && 
             error.response !== null;
    }

    /**
     * Gets a Google Calendar client.
     * 
     * @param auth The OAuth2 client to use for authentication.
     * @returns A Google Calendar client.
     */
    protected getCalendar(auth: OAuth2Client): calendar_v3.Calendar {
        return google.calendar({ version: 'v3', auth });
    }
}
