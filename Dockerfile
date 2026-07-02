# 모노레포(pnpm) → postdle 앱 컨테이너. 빌드 컨텍스트 = 모노레포 루트.
# 공유 @repo/post-editor 를 포함해 postdle 만 빌드. Next standalone(모노레포) 출력 사용.
FROM node:20-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile && pnpm --filter postdle build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Next standalone(모노레포)은 루트 구조로 생성됨: apps/postdle/server.js + node_modules
COPY --from=build /app/apps/postdle/.next/standalone ./
COPY --from=build /app/apps/postdle/.next/static ./apps/postdle/.next/static
COPY --from=build /app/apps/postdle/public ./apps/postdle/public
EXPOSE 3000
CMD ["node", "apps/postdle/server.js"]
