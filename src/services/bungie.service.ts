import axios, { AxiosInstance } from "axios";
import DatabaseService from "./database.service.js";
import { env } from "../config/env.js";
import LoggerService from "./logger.service.js";
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class BungieApiService {
  private static instance: BungieApiService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: env.BUNGIE_API_BASE_URL,
      headers: {
        "X-API-Key": env.BUNGIE_API_KEY,
      },
    });

    // Add response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return this.axiosInstance(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): BungieApiService {
    if (!BungieApiService.instance) {
      BungieApiService.instance = new BungieApiService();
      LoggerService.log("BungieApiService instance created");
    }
    return BungieApiService.instance;
  }

  private async refreshToken(): Promise<void> {
    try {
      const tokens = await DatabaseService.getTokens();
      if (!tokens?.refresh_token) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post<AuthTokens>(
        `${env.BUNGIE_API_BASE_URL}/Platform/App/OAuth/Token/`,
        {
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
          client_id: env.BUNGIE_CLIENT_ID,
          client_secret: env.BUNGIE_CLIENT_SECRET,
        }
      );

      await this.saveTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
      });
    } catch (error) {
      throw new Error("Failed to refresh token");
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    await DatabaseService.saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    // Update axios instance headers
    this.axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${tokens.access_token}`;
  }

  // Authentication methods
  public async authenticate(authCode: string): Promise<void> {
    try {
      const response = await axios.post<AuthTokens>(
        `${env.BUNGIE_API_BASE_URL}/App/OAuth/Token/`,
        {
          grant_type: "authorization_code",
          code: authCode,
          client_id: env.BUNGIE_CLIENT_ID,
          client_secret: env.BUNGIE_CLIENT_SECRET,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      await this.saveTokens(response.data);
    } catch (error) {
      throw new Error("Authentication failed", { cause: error });
    }
  }

  // Destiny 2 API methods
  public async getCurrentUser() {
    try {
      const response = await this.axiosInstance.get(
        "/User/GetMembershipsForCurrentUser/"
      );
      return response.data.Response;
    } catch (error) {
      throw new Error("Failed to get current user");
    }
  }

  public async getCharacters(
    membershipType: number,
    destinyMembershipId: string
  ) {
    try {
      const response = await this.axiosInstance.get(
        `/Destiny2/${membershipType}/Profile/${destinyMembershipId}/`,
        {
          params: {
            components: "200", // Character component
          },
        }
      );
      return response.data.Response.characters.data;
    } catch (error) {
      throw new Error("Failed to get characters");
    }
  }

  public async getVaultItems(
    membershipType: number,
    destinyMembershipId: string
  ) {
    try {
      const response = await this.axiosInstance.get(
        `/Destiny2/${membershipType}/Profile/${destinyMembershipId}/`,
        {
          params: {
            components: "102,300", // Profiles.Inventories and ItemInstances
          },
        }
      );
      return response.data.Response.profileInventory.data.items;
    } catch (error) {
      throw new Error("Failed to get vault items");
    }
  }

  public async getCharacterInventory(
    membershipType: number,
    destinyMembershipId: string,
    characterId: string
  ) {
    try {
      const response = await this.axiosInstance.get(
        `/Destiny2/${membershipType}/Profile/${destinyMembershipId}/Character/${characterId}/`,
        {
          params: {
            components: "201,300", // Character.Inventory and ItemInstances
          },
        }
      );
      return response.data.Response.inventory.data.items;
    } catch (error) {
      throw new Error("Failed to get character inventory");
    }
  }

  // Add more methods for specific inventory management operations
  public async getItemDefinition(itemHash: number) {
    try {
      const response = await this.axiosInstance.get(
        `/Destiny2/Manifest/DestinyInventoryItemDefinition/${itemHash}/`
      );
      return response.data.Response;
    } catch (error) {
      throw new Error("Failed to get item definition");
    }
  }
}

export default BungieApiService.getInstance();
