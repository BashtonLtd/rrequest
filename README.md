rrequest
========

Open Source modular support ticket tracker.

# Installation
- Install [Meteor](http://meteor.com)
- Install [Meteorite](https://github.com/oortcloud/meteorite/)
- Clone this repository
- Run `mrt` from within the cloned repository

# Configuration
- Edit the file `server/lib/init.js` 
  - Change the `URLROOT` variable to match the url that is used to access the site.
  - Change the `EMAIL_FROM` variable, this address is used when sending out email.
  - Change the `process.env.MAIL_URL` to point to your mail server.

# First run
Once rrequest is running create an account from the top right of the front page, the first created account will automatically be created as an admin user.
