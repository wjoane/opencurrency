FROM node:24-alpine

RUN apk add --no-cache libc6-compat git

WORKDIR /workspace

RUN mkdir -p /home/node/.npm /home/node/.expo \
 && chown -R node:node /home/node

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER node

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npx", "expo", "start"]
