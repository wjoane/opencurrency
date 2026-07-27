# Development image for the Expo dev server.
#
# Pinned to the Node 24 major line (Active LTS until Oct 2026). Patch releases are
# picked up on rebuild; the major version never moves on its own. Bump deliberately.
FROM node:24-alpine

# libc6-compat: glibc compatibility shim. Alpine uses musl, and a few npm
#   packages ship prebuilt binaries that expect glibc. Cheap insurance against
#   cryptic "Error loading shared library" failures in the Metro/Expo tree.
# git: EAS Build archives the project via git, so release builds need it
#   available inside the container.
RUN apk add --no-cache libc6-compat git

WORKDIR /workspace

# Create the cache directories that docker-compose mounts named volumes onto.
# Docker only inherits ownership from the image when the mount point already
# exists; otherwise it creates it as root:root and the node user cannot write,
# which breaks `expo install` and npm's cache.
RUN mkdir -p /home/node/.npm /home/node/.expo \
 && chown -R node:node /home/node

# Installs dependencies on first start when node_modules is absent. Deps are NOT
# baked into the image: the bind mount at /workspace would shadow them anyway.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# uid/gid 1000, matching the typical Linux desktop account, so everything written
# into the bind mount stays owned by the host user rather than root.
USER node

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npx", "expo", "start"]
