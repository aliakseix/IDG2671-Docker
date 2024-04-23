# FROM --platform=linux/amd64 node:21.6.1-slim
FROM node:21.6.1-slim

LABEL author="Aliaksei"
LABEL version="0.0.2"

# RUN apt-get update \
#     && apt-get install -y wget gnupg \
#     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
#       --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

EXPOSE 8080/tcp

RUN groupadd app-gr

RUN useradd -g app-gr usr


RUN mkdir /app

WORKDIR /app

COPY --chown=usr:app-gr . /app

RUN npm install

# running as root
# USER usr

# adding -- watch for reload
CMD ["node", "--inspect=0.0.0.0", "--watch", "backend/server.js"]