import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { isConnected, readServerEnv } from '@/lib/env';
import { accountForGoogle, accountForSession, verifiedGoogleProfile } from '@/server/accounts';
import { database } from '@/server/database';
import { enforceLimit } from '@/server/limits';
import type { Actor } from '@duraverso/core';

const nextAuth = NextAuth(() => {
  const env = readServerEnv();
  return {
    providers:
      env.DURAVERSO_MODE === 'connected'
        ? [
            Google({
              clientId: env.AUTH_GOOGLE_ID!,
              clientSecret: env.AUTH_GOOGLE_SECRET!,
              authorization: { params: { scope: 'openid email profile' } },
            }),
          ]
        : [],
    secret: env.AUTH_SECRET,
    trustHost: env.DURAVERSO_MODE === 'connected',
    session: { strategy: 'jwt' as const, maxAge: 60 * 60 * 24 },
    pages: { signIn: '/conta', error: '/conta' },
    logger: {
      error(error: Error) {
        console.error('Falha de autenticação:', error.name);
      },
    },
    callbacks: {
      async signIn({ account, profile }) {
        return isConnected() && account?.provider === 'google' && verifiedGoogleProfile.safeParse(profile).success;
      },
      async jwt({ token, account, profile }) {
        if (!isConnected()) return null;
        if (account) {
          if (account.provider !== 'google') return null;
          const checked = verifiedGoogleProfile.parse(profile);
          await enforceLimit('auth', `subject:${checked.sub}`);
          const actor = await accountForGoogle(database(), checked);
          // Não persistir e-mail, foto, token de acesso ou nome Google no JWT.
          return { sub: actor.id, version: actor.sessionVersion, name: actor.displayName, role: actor.role };
        }
        if (!token.sub || typeof token.version !== 'number') return null;
        const actor = await accountForSession(database(), token.sub, token.version);
        if (!actor) return null;
        return { ...token, name: actor.displayName, role: actor.role };
      },
      async session({ session, token }) {
        Object.assign(session.user, {
          id: token.sub!,
          name: token.name ?? 'Proprietário',
          version: token.version as number,
          role: token.role as Actor['role'],
        });
        return session;
      },
      async redirect({ url }) {
        try {
          const target = new URL(url, env.APP_ORIGIN);
          return target.origin === env.APP_ORIGIN ? target.href : `${env.APP_ORIGIN}/conta`;
        } catch {
          return `${env.APP_ORIGIN}/conta`;
        }
      },
    },
  };
});
export const { handlers } = nextAuth;
export async function currentActor(): Promise<Actor | null> {
  if (!isConnected()) return null;
  const session = await nextAuth.auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    displayName: session.user.name ?? 'Proprietário',
    role: session.user.role,
    sessionVersion: session.user.version,
  };
}
