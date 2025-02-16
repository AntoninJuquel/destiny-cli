import { Command } from "commander";
import AuthService from "../services/auth.service.js";
import LoggerService from "../services/logger.service.js";

const login = new Command("login");

login.description("Login to Bungie.net").action(async () => {
  try {
    LoggerService.log("Opening browser for authentication...");
    await AuthService.startOAuthFlow();
    LoggerService.log("Successfully authenticated with Bungie.net!");
  } catch (error) {
    LoggerService.error("Authentication failed:", error);
    process.exit(1);
  }
});

export default login;
