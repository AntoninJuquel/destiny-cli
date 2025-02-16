import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import path from "path";
import os from "os";
import LoggerService from "./logger.service.js";
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class DatabaseService {
  private db: Low<AuthTokens>;
  private static instance: DatabaseService;

  private constructor() {
    const dbPath = path.join(os.homedir(), ".destiny-cli", "data.json");
    this.db = new Low(new JSONFile(dbPath), {
      access_token: "",
      refresh_token: "",
      expires_at: 0,
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
      LoggerService.log("DatabaseService instance created");
    }
    return DatabaseService.instance;
  }

  public async getTokens(): Promise<AuthTokens | null> {
    await this.db.read();
    const result = this.db.data;
    return result;
  }

  public async saveTokens(tokens: AuthTokens): Promise<void> {
    this.db.data = tokens;
    await this.db.write();
  }

  public async clearTokens(): Promise<void> {
    this.db.data = {
      access_token: "",
      refresh_token: "",
      expires_at: 0,
    };
    await this.db.write();
  }
}

export default DatabaseService.getInstance();
