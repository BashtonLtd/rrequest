FROM ubuntu:12.04
MAINTAINER David Watson <david@bashton.com>

# Install required packages
RUN apt-get update
RUN apt-get install -qq -y python-software-properties software-properties-common curl git build-essential
RUN add-apt-repository ppa:chris-lea/node.js
RUN apt-get update
RUN apt-get install -qq -y nodejs
RUN curl https://install.meteor.com | /bin/sh
RUN npm install --silent -g forever meteorite

# Add rrequest source
ADD . /rrequest-source

# Bundle app
RUN cp -r /rrequest-source /rrequest-build && cd /rrequest-build && mrt install && meteor bundle --directory /rrequest

# Cleanup bundle
WORKDIR /rrequest
RUN rm -r programs/server/node_modules/fibers && npm install fibers@1.0.1

# Expose port
EXPOSE 3000

# Run app
RUN touch .foreverignore
CMD forever ./main.js
