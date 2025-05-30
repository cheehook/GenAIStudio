# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

# Use node 20.11.1 as the base image
FROM node:20.11.1 as vite-app
 
COPY react /usr/app/react
WORKDIR /usr/app/react

RUN ["npm", "install"]
RUN ["npm", "run", "build"]

FROM nginx:alpine

COPY --from=vite-app /usr/app/react/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=vite-app /usr/app/react/dist /usr/share/nginx/html
COPY ./react/env.sh /docker-entrypoint.d/env.sh

RUN chmod +x /docker-entrypoint.d/env.sh

# ENTRYPOINT ["nginx", "-g", "daemon off;"]
