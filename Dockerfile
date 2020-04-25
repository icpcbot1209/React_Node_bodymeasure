FROM node

# Bundle app source
COPY . .

RUN npm install

EXPOSE 8080
CMD [ "node", "server.js" ]
