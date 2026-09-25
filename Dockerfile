# syntax=docker/dockerfile:1

# Stage 1: build the SPA. It runs on the build machine's own platform (the
# x86_64 runner), not under emulation: the output is static files, the same
# for any target.
# Base images are pinned by digest (a multi-arch index), so a rebuild can't
# silently change what ships; Dependabot's docker ecosystem bumps them.
FROM --platform=$BUILDPLATFORM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The image is public: refuse to build one whose bundle holds a source map,
# an env file or a secret-shaped string.
RUN npm run build && sh scripts/check-public-bundle.sh dist

# Stage 2: serve it. This is the only stage built for the target platform
# (linux/arm64 in production), and it has no RUN step, so no emulation.
FROM nginx:stable-alpine@sha256:985220252f3863977e468f611ef118ebd01421289dd86ee1ae99cb068c3bce2b

# Replaces the stock server block, which listens on :80.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Its own directory, so nothing the base image ships in /usr/share/nginx/html
# (its stock index.html and 50x.html) is served.
COPY --from=build /app/dist /usr/share/nginx/dashboard

# The image's nginx user. nginx writes its pid to /var/run and temp files
# under /var/cache/nginx; the chart mounts emptyDirs there under a read-only
# root filesystem (docker run: --read-only --tmpfs /var/run --tmpfs /var/cache/nginx).
USER 101:101
EXPOSE 8080
