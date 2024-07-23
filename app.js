if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/expreeError.js');
const listingRouter = require('./routes/listings.js');
const reviewRouter = require('./routes/reviews.js');
const userRouter = require('./routes/users.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

// const mongoDB_url='mongodb://127.0.0.1:27017/VacayStay';
const dbUrl=process.env.ATLASDB_URL;

main()
  .then((res) => {
    console.log('Connected to Database');
  })
  .catch((err) => {
    console.log(err);
  })

async function main() {
  await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24*3600,
});

store.on('error',()=>{
  console.log('Error in Mongo Session Store',err);
})

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};

app.use(session(sessionOptions));
app.use(flash());

//passport configuring
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currUser = req.user;
  next();
})

//all Listings routes
app.use('/listings', listingRouter);

//all Reviews routes
app.use('/listings/:id/reviews', reviewRouter);

//all users routes
app.use('/', userRouter);

// all route(if any route is not match above the route then this route will be executed.)
app.all('*', (req, res, next) => {
  next(new ExpressError(404, 'Page Not Found!'));
})

//custom error handling
app.use((err, req, res, next) => {
  let { status = 500, message = 'Something Went Wrong!' } = err;
  res.status(status).render('error.ejs', { message });
})

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
})