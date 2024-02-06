FROM node:21.6.1-slim

LABEL author="Aliaksei"
LABEL version="0.0.1"

EXPOSE 8081/tcp

ENV MONGO_INITDB_ROOT_USERNAME=aliaksei \
	MONGO_INITDB_ROOT_PASSWORD=123pwd

RUN groupadd app-gr

RUN useradd -g app-gr usr

# RUN mkdir /app\
# 	chown -R usr:app-gr /app

RUN mkdir /app

WORKDIR /app

COPY --chown=usr:app-gr . /app

RUN npm install

USER usr

CMD node server.js