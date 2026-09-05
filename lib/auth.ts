// lib/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  // ساخت خودکار پروفایل اولیه به محض ثبت‌نام کاربر
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await prisma.profile.create({
              data: {
                id: user.id,
                role: 'user',
                plan: 'free',
                calendarType: 'jalali',
              },
            });
            await prisma.brainProfile.create({
              data: {
                userId: user.id,
              },
            });
          } catch (e) {
            console.error('Error creating user profile defaults:', e);
          }
        },
      },
    },
  },
});