const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-openidconnect');

const app = express();

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const strategy = new Strategy({
   issuer: 'http://10.0.0.9:8080/auth/realms/master',
   authorizationURL: 'http://10.0.0.9:8080/auth/realms/master/protocol/openid-connect/auth',
   tokenURL: 'http://10.0.0.9:8080/auth/realms/master/protocol/openid-connect/token',
   userInfoURL: 'http://10.0.0.9:8080/auth/realms/master/protocol/openid-connect/userinfo',
   clientID: 'myclient',
   clientSecret: 'PUT YOUR SECRET HERE',
   callbackURL: 'http://10.0.0.9:3000/callback',
   scope: 'openid'
}, (issuer, profile, done) => {
	   console.log('Inside strategy callback');
	   console.log('Issuer:', issuer);
	   console.log('Profile:', profile);
   // Perform necessary verification here
   if (!profile) {
      console.error('Profile not found');
      return done(null, false, { message: 'Failed to retrieve user profile' });
   }
   console.log('Authentication successful');
   return done(null, profile);
});

passport.use('oidc', strategy);

app.get('/login', passport.authenticate('oidc'));

function handleAuthCallback(err, user, info) {
  if (err) { 
    console.error("Error in authentication callback:", err);
    return res.redirect('/login'); // Handle errors
  }
  req.logIn(user, function(err) {
    if (err) { 
      console.error("Error during login:", err);
      return res.redirect('/login'); // Handle errors
    }
    return res.redirect('/');
  });
}

app.get('/callback', passport.authenticate('oidc', {
  successRedirect: '/',
  failureRedirect: '/login'
}), (req, res) => {
  // This will never be called since `passport.authenticate` handles the redirect.
});

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Welcome, ${req.user.displayName}! <a href="/logout">Logout</a>`);
  } else {
    res.send('Please <a href="/login">login</a>');
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

app.listen(3000, () => console.log('App listening on port 3000'));
