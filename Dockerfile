FROM node:alpine

RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENTRYPOINT ["npm", "run"]
CMD ["development"]