#base for all images
FROM ubuntu:bionic as nodejs_base
ENV CI=true
RUN \
  apt-get update && \
  apt-get install -y curl && \
  curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
  apt-get install -y nodejs && \
  rm -rf /var/lib/apt/lists/*


#builder base
FROM nodejs_base as builder
RUN useradd --create-home builder
USER builder


#frontend
##first npm deps only (speed up for cache)
FROM builder as frontend_builder
COPY --chown=builder:builder frontend/package.json /home/builder/frontend/package.json
COPY --chown=builder:builder frontend/package-lock.json /home/builder/frontend/package-lock.json
RUN cd /home/builder/frontend && npm install --no-save

## then the build itself
COPY --chown=builder:builder frontend /home/builder/frontend
RUN cd /home/builder/frontend && npm run build && npm test


#backend
FROM builder as backend_builder
##first npm deps only (speed up for cache)
COPY --chown=builder:builder backend/package.json /home/builder/backend/package.json
COPY --chown=builder:builder backend/package-lock.json /home/builder/backend/package-lock.json
RUN cd /home/builder/backend && npm install --no-save

## then the build itself
COPY --chown=builder:builder backend /home/builder/backend

USER builder
RUN cd /home/builder/backend && npm run build && npm test


#backend

#final image
FROM nodejs_base
RUN useradd --create-home user

COPY --from=frontend_builder /home/builder/frontend/build/ /home/user/frontend/build

COPY --from=backend_builder /home/builder/backend/build/ /home/user/backend/build
COPY --from=backend_builder /home/builder/backend/package.json /home/user/backend
COPY --from=backend_builder /home/builder/backend/package-lock.json /home/user/backend

WORKDIR /home/user/backend
RUN npm install --only=prod --no-save 

CMD node /home/user/backend/build/app.js
