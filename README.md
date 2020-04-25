# BodyMeasure

### React + NodeJS for measuring body size form front and side photos

![](/readme/Screenshot_21.png)
![](/readme/Screenshot_31.png)

### BodyMeasure/client/

This folder is the scope for Reactjs frontend code.
Here "npm install" installs node_modules for frontend development.
Here "npm start" only expires frontend html on "locahost:3000";
here "npm run build" compiles all code into ./client/build folder for server to use.

### BodyMeasure/

This outside folder is the scope for nodejs server.
Here "npm install" installs node_modules
"npm run dev" expires developer mode on "localhost:3000". Anything you "edit and Save" on the code will be represent on your screen immediately.
"npm start" expires production mode on "localhost:8080". It includes /client/build folder as the static html frontend.

### Dockerfile

It can be build into docker image and container for deploying to Google cloud platform or AWS.
