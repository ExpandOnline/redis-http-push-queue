FROM node:6.11
ARG COMMIT_HASH

# Make required directories
RUN mkdir -p /usr/src/app
RUN mkdir -p /root/.ssh
WORKDIR /usr/src/app

# Clone repository
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
RUN git clone https://github.com/ExpandOnline/redis-http-push-queue.git ./.git --mirror --config core.bare=false && git checkout -f $COMMIT_HASH

# Make a /usr/src/app/config symlink to /config
RUN mkdir -p /config
COPY ./conf /config
RUN ln -sf /config/local-production.json /usr/src/app/config/local-production.json
RUN ln -sf /config/local-development.json /usr/src/app/config/local-development.json
RUN ln -sf /config/default.json /usr/src/app/config/default.json

# Install application
RUN npm install

# Run application
ENV NODE_ENV production
CMD ["npm", "run", "start-debug"]