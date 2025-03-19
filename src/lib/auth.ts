import { betterAuth, BetterAuthPlugin } from "better-auth";
import {
  twoFactor,
  magicLink,
  emailOTP,
  admin,
  captcha,
  openAPI,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

// await redis.connect();

const plugins: BetterAuthPlugin[] = [
  twoFactor({
    otpOptions: {
      async sendOTP({ otp, user }) {
        console.log(
          `[BETTER_AUTH]: [TWO_FACTOR_OTP] Hi ${user.name}, this is your otp code: ${otp}`
        );
      },
    },
  }),
  magicLink({
    sendMagicLink: async ({ email, url }) => {
      console.log(
        `[BETTER_AUTH]: [MAGIC_LINK] Hi ${email}, click the link to authenticate: ${url}`
      );
    },
  }),
  emailOTP({
    sendVerificationOTP: async ({ email, otp, type }) => {
      console.log(
        `[BETTER_AUTH]: [VERIFICATION OTP] [type=${type}] Hi ${email}, this is your otp code: ${otp}`
      );
    },
  }),
  passkey(),
  admin({ adminRoles: ["admin", "superadmin"] }),
  openAPI(),
];

if (process.env.NODE_ENV === "production") {
  plugins.push(
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
    })
  );
}

export const auth = betterAuth({
  appName: "KIC App",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log({ url });
      console.log(
        `[BETTER_AUTH]: [RESET_PASSWORD] Hi ${user.email}, click the link to reset your password: ${url}`
      );
    },
  },
  advanced:
    process.env.NODE_ENV === "production"
      ? {
          cookiePrefix: "kic",
          crossSubDomainCookies: {
            enabled: true,
            domain: ".ptkic.site",
          },
          defaultCookieAttributes: {
            secure: true,
            httpOnly: true,
            sameSite: "none", // Allows CORS-based cookie sharing across subdomains
            partitioned: true, // New browser standards will mandate this for foreign cookies
          },
          useSecureCookies: true,
        }
      : undefined,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS!.split(","),
  // secondaryStorage: {
  //   get: async (key) => {
  //     const value = await redis.get(key);
  //     return value ? JSON.stringify(value) : null;
  //   },
  //   set: async (key, value, ttl) => {
  //     if (ttl) await redis.set(key, value, { EX: ttl });
  //     // or for ioredis:
  //     // if (ttl) await redis.set(key, value, 'EX', ttl)
  //     else await redis.set(key, value);
  //   },
  //   delete: async (key) => {
  //     await redis.del(key);
  //   },
  // },
  // rateLimit: {
  //   storage: "secondary-storage",
  // },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
          return {
            data: {
              ...user,
              role: adminEmails.includes(user.email) ? "admin" : "user",
            },
          };
        },
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: Add resend here!
      console.log(
        `[BETTER_AUTH]: [EMAIL_VERIFICATION] Hi ${user.email}, click the link to verify you email: ${url}`
      );
    },
    sendOnSignUp: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins,
});

export type Session = typeof auth.$Infer.Session;
