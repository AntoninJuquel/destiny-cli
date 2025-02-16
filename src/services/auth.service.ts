import express from "express";
import https from "https";
import open from "open";
import path from "path";
import fs from "fs";
import os from "os";
import { execSync } from "child_process";
import BungieApiService from "./bungie.service.js";
import DatabaseService from "./database.service.js";
import LoggerService from "./logger.service.js";

class AuthService {
  private static instance: AuthService;
  private app: express.Application;
  private server: https.Server;
  private serverInstance: any;
  private certPath = path.join(os.homedir(), ".destiny-cli", "server.cert");
  private keyPath = path.join(os.homedir(), ".destiny-cli", "server.key");

  private constructor() {
    this.ensureSSLCertificates();
    this.app = express();
    this.server = https.createServer(
      {
        key: fs.readFileSync(this.keyPath),
        cert: fs.readFileSync(this.certPath),
      },
      this.app
    );
  }

  private ensureSSLCertificates(): void {
    // Create the .destiny-cli directory if it doesn't exist
    const destinyCliDir = path.join(os.homedir(), ".destiny-cli");
    if (!fs.existsSync(destinyCliDir)) {
      fs.mkdirSync(destinyCliDir, { recursive: true });
    }

    if (fs.existsSync(this.keyPath) && fs.existsSync(this.certPath)) {
      return;
    }

    LoggerService.log("Generating self-signed SSL certificates...");
    try {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout "${this.keyPath}" -out "${this.certPath}" -days 365 -nodes -subj "/CN=localhost"`
      );
      LoggerService.log("SSL certificates generated successfully.");
    } catch (error) {
      LoggerService.error("Failed to generate SSL certificates:", error);
      throw new Error("Failed to generate SSL certificates");
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
      LoggerService.log("AuthService instance created");
    }
    return AuthService.instance;
  }

  public async startOAuthFlow(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = 3000;

      // Setup OAuth callback endpoint
      this.app.get(
        "/oauth",
        async (req: express.Request, res: express.Response) => {
          try {
            const { code } = req.query;

            if (!code || typeof code !== "string") {
              throw new Error("No authorization code received");
            }

            await BungieApiService.authenticate(code);

            res.send("Authentication successful! You can close this window.");

            // Cleanup: close the server
            if (this.serverInstance) {
              this.serverInstance.close();
            }

            resolve();
          } catch (error) {
            LoggerService.error("Authentication failed:", error);
            res.status(500).send("Authentication failed. Please try again.");
            reject(error);
          }
        }
      );

      // Start the server
      this.serverInstance = this.server.listen(port, () => {
        LoggerService.log(`Waiting for authentication on port ${port}...`);

        // Construct the OAuth URL
        const authUrl = new URL("https://www.bungie.net/en/OAuth/Authorize");
        authUrl.searchParams.append(
          "client_id",
          process.env.BUNGIE_CLIENT_ID || ""
        );
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append(
          "redirect_uri",
          `https://localhost:${port}/oauth`
        );

        // Open the browser for authentication
        open(authUrl.toString()).catch(LoggerService.error);
      });
    });
  }

  public async logout(): Promise<void> {
    // Implement logout logic (clear tokens from database)
    await DatabaseService.clearTokens();
  }
}

export default AuthService.getInstance();
