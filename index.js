var express = require("express");
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

const https = require("https");

const passport = require('passport');

var saml = require('passport-saml');
var fs = require('fs');


var app = express();

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(session({secret: 'secret', resave: false, saveUninitialized: true,}));

app.get('/',
    function(req, res) {
        res.send('Home Page');
    }
);

const options = {
  key: fs.readFileSync("./certs/key.pem"),
  cert: fs.readFileSync("./certs/cert.pem")
};


https.createServer(options, app).listen(4000, function () {
  console.log('Listening on port 4000')
});

passport.serializeUser(function(user, done) {
  console.log('serialized user');
  console.log(user);
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  console.log('deserialized');
  console.log(user);
  done(null, user);
});



var samlStrategy = new saml.Strategy({
callbackUrl: 'http://localhost/login/callbackURL',
entryPoint: '<<URL_here>>',
issuer: '<<issuer_here>>',
identifierFormat: null,
decryptionPvk: fs.readFileSync('./certs/key.pem', 'utf8'),
privateCert: fs.readFileSync('./certs/key.pem', 'utf8'),
validateInResponseTo: false,
disableRequestedAuthnContext: true
}, function(profile, done) {
    return done(null, profile);
});

passport.use('samlStrategy', samlStrategy);

app.use(passport.initialize({}));
app.use(passport.session({}));

app.get('/login',function (req, res, next) {
        console.log(__dirname);
        console.log('Start login');
        next();
    },
    passport.authenticate('samlStrategy'),
);

app.post('/login/callbackURL',
    function (req, res, next) {
        console.log('Start callback');
        next();
    },
    passport.authenticate('samlStrategy'),
    function (req, res) {
        console.log('login callback');
        console.log(req.user);
        res.send('Login Success');
    }
);


app.get('/metadatafile',
    function(req, res) {
        res.type('application/xml'); 
        res.status(200).send(
          samlStrategy.generateServiceProviderMetadata(
             fs.readFileSync('./certs/cert.pem', 'utf8'), 
             fs.readFileSync('./certs/cert.pem', 'utf8')
          )
        );
    }
);

