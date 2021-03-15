const express = require('express');
const multer = require('multer');
const app = express();
const Sequelize = require('sequelize');
const hbs = require('hbs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const flash = require('connect-flash');
const expressSession = require('express-session');
const bcrypt = require('bcrypt-nodejs');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
const LocalStrategy = require('passport-local').Strategy;
const port = 3000;


passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findByPk(id, function(err, user) {
    done(err, user);
  });
});

global.user;

app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) =>{
    cb(null, file.originalname);
  }
});

app.use(multer({storage:storageConfig}).single("filedata"));

app.set('view engine', hbs);

const seq = new Sequelize('Blog', 'root', 'Pass_1111', {
  dialect: 'mysql',
  host: 'localhost',
  define: {
    timestamps: false  
  }
});

const User = seq.define('User', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  nickName: {
    type: Sequelize.STRING(25),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: Sequelize.STRING(25),
    allowNull: false
  },
  lastName: {
    type: Sequelize.STRING(25),
    allowNull: false
  },
  info: {
    type: Sequelize.STRING(200),
    allowNull: true
  },
  image: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  password: {
    type: Sequelize.STRING(100),
    allowNull: true
  }
});

const Subscriber = seq.define('Subscriber', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  subscriberId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  subscribeToId: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
});

const Post = seq.define('Post', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  text: {
    type: Sequelize.STRING(3000),
    allowNull: false
  },
  date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false
  },
  likes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  image: {
    type: Sequelize.STRING(100),
    allowNull: true
  }
});

const Comment = seq.define('Comment', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  text: {
    type: Sequelize.STRING(3000),
    allowNull: false
  },
  date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false
  },
  likes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
});

User.hasMany(Post, {onDelete: "cascade"});
User.hasMany(Comment, {onDelete: "cascade"});
Post.hasMany(Comment, {onDelete: "cascade"});

Subscriber.belongsTo(User, {as: 'subscriber', foreignKey: 'subscriberId', constraints: false});
Subscriber.belongsTo(User, {as: 'subscribeTo', foreignKey: 'subscribeToId', constraints: false});

User.create({nickName: 'fgfsfg', firstName: 'Ivan', lastName: 'Idssd', info: 'dsdasdssddsads', image: 'ss.jpg'});
User.create({nickName: 'fgfsfg2', firstName: 'Ivan2', lastName: 'Idssd2', info: 'dsdasdssddsads', image: 'ss.jpg'});
User.create({nickName: 'fgfsfg3', firstName: 'Ivan3', lastName: 'Idssd3', info: 'dsdasdssddsads', image: 'ss.jpg'});

Subscriber.create({subscriberId: 39, subscribeToId: 17});

Post.create({title: 'ppppp', text: 'osaiudbnd', UserId: 4});
Post.create({title: 'ppppp', text: 'osaiudbnd', UserId: 17});


User.findOne({where: {nickName: "fgfsfg"}})
.then(user =>{
    if(!user) return;
     
    User.findOne({where: {nickName: "fgfsfg2"}})
        .then(user2 =>{
            if(!user2) return;
            Subscriber.create({subscriberId: user.id, subscribeToId: user2.id});
    });
});

var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
}

app.get('/', (req, res) => {
  res.render('registration.hbs');
});

app.get('/login', (req, res) => {
  res.render('login.hbs');
});

app.get('/main', async (req, res) => {
  if(user){
    let subs = await Subscriber.findAll({where: {subscriberId: user.id}});
    let subscribes = [];
    subs.forEach(s => subscribes.push(s.subscribeToId));
    let posts = await Post.findAll({where: {UserId: subscribes}});
    res.render('main.hbs', {posts: posts, user: user});
  }
  else{
    res.redirect('/login');
  }
});

app.get('/profile/id=:id', async (req, res) => {
  let user = await User.findByPk(Number(req.params.id));
  if(user){
    let posts = await Post.findAll({where: {UserId: req.params.id}});
    res.render('profile.hbs', {user: user, posts: posts});
  }
  else{
    res.send(404);
  }
});

app.get('/myprofile', async (req, res) => {
  if(user){
    let posts = await Post.findAll({where: {UserId: user.id}});
    res.render('myprofile.hbs', {user: user, posts: posts});
  }
  else{
    res.send(404);
  }
});

app.get('/post/id=:id', async (req, res) => {
  let post = await Post.findByPk(req.params.id);
  let user = await User.findByPk(post.UserId);
  let comments = await Comment.findAll({where: {PostId: req.params.id}});
  res.render('post.hbs', {post: post, comments: comments, user: user});
});

app.get('/search', (req, res) => {
  res.render('search.hbs', {user: user});
});

app.post('/signup', (req, res) => {
  let password = bcrypt.hashSync(req.body.password);
  req.body.password = password;
  User.create({nickName: req.body.nickname, password: req.body.password, firstName: req.body.firstname, lastName:req.body.lastname, info: 'dsdasdssddsads', image: 'ss.jpg'});
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  let loginUser = await User.findOne({where: {nickName: req.body.nickname}});

  if(loginUser){
    let pass = bcrypt.compareSync(req.body.password, loginUser.password);
    if(pass){
      let token = jwt.sign({
        nickName: loginUser.nickName,
        userId: loginUser.id
      }, 'test', {expiresIn: 36000});

      user = loginUser;
      res.redirect('/main');
    }
  };
});

app.post('/logout', async (req, res) => {
  user = undefined;
  res.redirect('/login');
});

app.post('/addpost/:id', async (req, res) => {
  let filedata = req.file;
  await Post.create({title: req.body.title, text: req.body.text, UserId: req.params.id, image: filedata.filename});
  res.redirect('/myprofile');
});

app.post('/search', async (req, res) => {
  let findUser = await User.findOne({where: {nickName: req.body.nickname}});
  res.render('search.hbs', {findUser: findUser});
});

app.post('/subscribe/:id', async (req, res) => {
  await Subscriber.create({subscriberId: user.id, subscribeToId: req.params.id});
  res.redirect('/main');
});

app.post('/addcomment/:id', async (req, res) => {
  await Comment.create({UserId: user.id, PostId: req.params.id, text: req.body.text});
  res.redirect('/post/id=' + req.params.id);
});

seq.sync().then(result => {
  console.log(result);
})
.catch(err=> console.log(err));

app.listen(port);

