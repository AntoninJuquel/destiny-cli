import * as z from "zod";
import "dotenv/config";

function createEnv(): z.infer<typeof envSchema> {
  const envSchema = z.object({
    BUNGIE_API_KEY: z.string(),
    BUNGIE_CLIENT_ID: z.string(),
    BUNGIE_CLIENT_SECRET: z.string(),
    BUNGIE_OAUTH_URL: z.string(),
    BUNGIE_REDIRECT_URI: z.string(),
    BUNGIE_API_BASE_URL: z.string(),
  });

  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.error("Invalid environment variables", parsedEnv.error.format());
    process.exit(1);
  }

  return parsedEnv.data;
}

export const env = createEnv();
