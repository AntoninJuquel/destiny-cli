import { Command } from "commander";
import AuthService from "../services/auth.service.js";
import LoggerService from "../services/logger.service.js";

const logout = new Command("logout");

logout.description("Logout from Bungie.net").action(async () => {
  try {
    await AuthService.logout();
    LoggerService.log("Successfully logged out!");
  } catch (error) {
    LoggerService.error("Logout failed:", error);
    process.exit(1);
  }
});

export default logout;
