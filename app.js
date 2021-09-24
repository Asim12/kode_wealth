var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//Imp..........waqas
var cors = require('cors')
const bodyParser = require("body-parser");
///end waqas

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();


//........waqas
global.__basedir = __dirname;

app.use(cors({ origin: true }));
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
//end waqas

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static((__dirname+"/public")))

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// var io = require('socket.io-client');
// var socket = io.connect('http://3.120.159.133:3000/');

// socket.emit('buyer', '');
// socket.on("buyer", async msg => {
//   console.log(await msg)
// })

// var socket = io.connect();
// socket.emit('create', {room : 'room1'});

// let recived_id = '';
// let chat_id  = ''
// socket.emit('addUser', '612c906ed2d12b576b8dc273');
// socket.on('getUsers', async msg => {
//   console.log('total Connected Users are', await msg)
//   recived_id = await msg.socketId;
// })
      
// socket.emit('createChat', { orderId: "44444", senderId: "123", receiverId: "999999" });
// socket.on('createChat', async chat_id => {

//   console.log('Chat id => ',chat_id);

//   socket.emit('sendMessage', { orderId: "44444", senderId: '123', receiverId: '999999', text: 'Asim', chat_id : chat_id, traveler_status : 'buyer'} );  //senderId, receiverId, text
//   socket.emit('sendMessage', { orderId: "44444", senderId: '123', receiverId: '999999', text: 'hello kesy ha 111111111111', chat_id : chat_id, traveler_status : 'buyer'} );
//   socket.emit('sendMessage', { orderId: "44444", senderId: '123', receiverId: '999999', text: 'allah ka shukar ha11111111111111111', chat_id : chat_id, traveler_status : 'buyer'} );

// })

 
// setInterval(()=> {
//   console.log('Chat is Listing');
//   socket.on('getMessage', async msg1 => {
//     console.log('message', await msg1)
//     // recived_id = await msg.socketId;
//   })
// },1000)



// socket.emit('create', {room: 'room1', userId: '123', withUserId:'0000'});
// socket.on("create", async msg => {
//   console.log(await msg)
// })


// let message =
// {
//    room: 'room1',
//    message: [
//      {
//        text: 'asim',
//        user: {

//         _id: 2,
//         name: 'React Native',
//         avatar: 'https://placeimg.com/140/140/any',

//        },
//        createdAt: '2021-08-25T13:31:10.101Z',
//        _id: '3c8a9754-7c11-443e-a0fb-0c889dbb038c'
//      }
//    ],
//    from: 'asim'
//  }

// socket.emit('message', message);
// socket.on('message', function(msg) {

//   console.log(msg)
// });

module.exports = app;
