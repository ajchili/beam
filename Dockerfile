FROM node:20-alpine

COPY packages/server/package.json .
COPY packages/server/dist .
COPY packages/web-asset/dist asset

RUN npm i --omit dev

CMD [ "node", "." ]