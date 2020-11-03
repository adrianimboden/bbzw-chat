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


#frontend
FROM builder as frontend_builder
COPY frontend /home/builder/frontend
RUN chown -R builder:builder /home/builder/

USER builder
WORKDIR /home/builder/frontend
RUN npm install --no-save
RUN npm run build
RUN npm test


#backend
FROM builder as backend_builder
COPY backend /home/builder/backend
RUN chown -R builder:builder /home/builder/

USER builder
WORKDIR /home/builder/backend
RUN npm install --no-save
RUN npm run build


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
