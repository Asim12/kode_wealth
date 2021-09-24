var express       =   require('express');
var router        =   express.Router();
var str_replace   =   require('str_replace');
// const fs          =   require('fs');
const path        =   require('path');
const MongoClient =   require('mongodb').MongoClient;
const objectId    =   require('mongodb').ObjectID;
var conn          =   require("../conn/connection");
var helperCon     =   require("../helper/helpers");
const bcrypt      =   require('bcrypt');
var validator     =   require("email-validator");  
const Binance     =   require('node-binance-api');
var https         =   require('https');
const Stripe      =   require('stripe');
const aws         =   require('aws-sdk');
const Busboy      =   require('busboy');
var Changelly     =   require("../lib/library.js"); 
const  fetch      =   require('node-fetch'); 
var md5           =   require('md5'); 
var CoinMarketCap =   require("node-coinmarketcap"); 
var coinmarketcap =   new CoinMarketCap();   
const jwtCreate   =   require('jsonwebtoken');
const  s3bucket   =   require('aws-sdk');
const nodemailer  =   require("nodemailer");
const { parse }   =   require('path');
// import { io } from "socket.io-client";

// var http         =   require('http');
// const server = http.createServer(express);
// const { Server } = require("socket.io");
// const io = new Server(server);

// var app = require('http').createServer(handler)
// var io = require('socket.io')(express);
// var fs = require('fs');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, __basedir+"/public/upload");
  },
  filename: (req,  file, callback) => {

    console.log('orignal_name :=======>', file.originalname)
    let image_extension = path.extname( file.originalname)

    let date = new Date().valueOf().toString()
    let newName = date.concat(image_extension.toString())
    console.log('New_name :=======>', newName)
    file.originalname = newName
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

var changelly = new Changelly(
  'yIvKnTS5AzmcyoN7juE2uu2SB_z68jkn',
  'Cb3B75vOKURhUd3WV0L4NNghvfmoCM5v'
);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;


/////////////////////////////////////////////////////////////////////// Account Api's /////////////////////////////////////////////////////////////////

//signup
router.post('/signUp', async function(req, res, next) {

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;

    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])


    if(username === usernameApi   &&  password == passwordApi){
    
      let email_address       =   (req.body.email_address).trim();
      let password            =   (req.body.password).trim();
      let confirmed_password  =   (req.body.confirmed_password).trim();

      if( validator.validate(email_address) == true && validator.validate(password) == false ){

        let emailExist    = await helperCon.findEmailExists(email_address);
      
        if(emailExist > 0 ){

          var responseArray = {
            'status' : 'Emial already exists',
            'type'   : 404,
          };
          res.status(404).send(responseArray);
        } else if(password === confirmed_password)  {

          let passwordEncryption = await helperCon.passwordEncryption(password) 
          var responseArray = {  
            'nickName'            :   req.body.nickName.toString(),
            "email_address"       :   (req.body.email_address.toString()).trim(),
            "phone_number"        :   req.body.phone_number.toString(),
            'password'            :   (passwordEncryption.toString()).trim(),
            "orignal_password"    :   (req.body.password.toString()).trim(),
            "user_role"           :   1,
            "created_date"        :   new Date(),
            'date_of_birth'       :   new Date(req.body.date_of_birth),
            'selected_currency'   :   req.body.selected_currency,
            'status'              :   'Successfully Created',
            'type'                :   200
              
          };
          var db = await conn;
          await db.collection('users').insertOne(responseArray, (err, result) => {
            if(err){
              res.status(404).send(err);
            }else{
              
              res.status(200).send(responseArray);
            }
          });

        }else{

          var responseArray = {
            'status' : 'Password are not Matched',
            'type'   : 404,
          };
          res.status(404).send(responseArray);

        }
      
      }else{//end email validationelse

        var responseArray = {
          'status' : 'Emial are not valid or email are not allowed as password',
          'type'   : 404,
        };
        res.status(404).send(responseArray);
      }
    }else{//auth check if end

      var responseArray = {
        'status' : 'Authentication Failed',
        'type'   : 404,
      };
      res.status(404).send(responseArray);
    }
  }else{ //end if header check
    var responseArray = {
      'status' : 'Header Missing!!!',
      'type'   : 404,
    };
    res.status(404).send(responseArray);
  }
});

//login for Mobile
router.post('/login', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      let email_address = (req.body.email_address).trim();
      let password      = ((req.body.password).toString()).trim();

      if(email_address.length > 0  && password.length > 0){

        let loginType   = await helperCon.userData(email_address, password);

        if(loginType.length > 0 && loginType[0].password != undefined ){
          
          let loginStatus = bcrypt.compareSync(password, loginType[0].password); // true

          if(loginStatus == true){

            var responseArray = {
              'status'    : 'Successfully Login',
              'userData'  :  { ...loginType }, 
              'type'      : 200
            };
            res.status(200).send(responseArray);

          }else{
            var responseArray = {

              'status' : 'email or password are wrong',
              'type'   : 404
            };
            res.status(404).send(responseArray);

          }

        }else{
          var responseArray = {
            'status' : 'emial or password are wrong',
            'type'   : 404
          };
          res.status(404).send(responseArray);

        }
      }else{

        var responseArray = {
          'status' : 'wrong parameters',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{
      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Headers are Missing!!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }

});
//login for adminkk
router.post('/loginAdmin', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      let email_address = (req.body.email).trim();
      let password      = ((req.body.password).toString()).trim();

      if(email_address.length > 0  && password.length > 0){

        let loginType   = await helperCon.userDataAdmin(email_address, password);

        if(loginType.length > 0 && loginType[0].password != undefined ){
          
          let loginStatus = bcrypt.compareSync(password, loginType[0].password); // true

          if(loginStatus == true){

            var responseArray = {
              'status'    : 'Successfully Login',
              'userData'  :  { ...loginType },
              'type'      : 200
            };
            res.status(200).send(responseArray);

          }else{
            var responseArray = {

              'status' : 'email or password are wrong',
              'type'   : 404
            };
            res.status(404).send(responseArray);

          }

        }else{
          var responseArray = {
            'status' : 'email/password are wrong or its not an Admin Account',
            'type'   : 404
          };
          res.status(404).send(responseArray);

        }
      }else{

        var responseArray = {
          'status' : 'wrong parameters',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{
      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'Headers Missing',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }
});

//pin enabled
router.post('/pinEnabled', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address =   (req.body.email).trim();
      let pin           =   (req.body.pin).toString();

      if(email_address.length > 0 && pin.length > 0  &&  pin.length == 4){

        let pinEncrypted = await helperCon.pinEncryptionAndSave(pin , email_address);
        if(pinEncrypted == true){

          let response = {
            enabledPin: req.body.pin,
            status: "Pin Successfully Enabled!",
            type  : 200
          }
          res.status(200).send(response)
        }else{

          let response = {

            status: "please use different pin this is already enabled in your account!",
            type  : 403
          }
          res.status(403).send(response)
        }

      }else{

        var responseArray = {
          'status' : 'Parameters are wrong!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }

});

//pin change
router.post('/pinChange', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address   =   (req.body.email_address).trim();
      let new_pin         =   (req.body.new_pin).toString();
      let confirmed_pin   =   (req.body.confirmed_pin).toString();
      let old_pin         =   (req.body.old_pin).toString();

      if(email_address.length > 0 && new_pin === confirmed_pin){

        let userPinChange = await helperCon.pinChange(email_address, new_pin, old_pin);
        if(userPinChange == true){

          let response = {
            newPin  : req.body.new_pin,
            status  : "Pin Successfully Changed!",
            type    : 200
          }
          res.status(200).send(response)
        }else{

          let response = {

            status: "Pin not set or Already use!",
            type  : 403
          }
          res.status(403).send(response)
        }
      }else{

        var responseArray = {

          'status' : 'Parameters are wrong or pin not Matched!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{
      var responseArray = {

        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {

      'status' : 'Header Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }

});

//login with pin
router.post('/loginWithPin', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email      =   (req.body.emial_address).trim();
      let user_pin   =   (req.body.user_pin).toString();

      let userDetail  = await helperCon.userData(email);
      
      
      if(userDetail.length > 0 && userDetail[0].pin != undefined ){

        let loginStatus = bcrypt.compareSync(user_pin, userDetail[0].pin); // true

        if(loginStatus == true){

          var responseArray = {
            'status' : 'Successfully Login',
            'type'   : 200,
            userData : { ...userDetail },
          };
          res.status(200).send(responseArray);

        }else{
          var responseArray = {

            'status' : 'email or pin are wrong',
            'type'   : 404
          };
          res.status(404).send(responseArray);

        }
      }else{

        var responseArray = {
          'status' : 'wrong parameters or pin not active',
          'type'   : 404
        };
        res.status(404).send(responseArray);

      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }

})

router.post('/passwordResetEmailCodeSend', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address =   (req.body.email_address).trim();
      let emailExist    =   await helperCon.findEmailExists(email_address);

      if(emailExist > 0 ){
        
        let generatedEmailResponse  =   await helperCon.generateEmailConfirmationCodeSendIntoEmail(email_address);

        if(generatedEmailResponse == true){
          
          var responseArray = {
            'status' : 'confirmation code are successfully sended your email which are associated with your account!',
            'type'   : 200
          };
          res.status(200).send(responseArray)
        }else{
          var responseArray = {

            'status' : 'SomeThing Went Wrong!',
            'type'   : 404
          };
          res.status(404).send(responseArray);

        }
      }else{

        var responseArray = {

          'status' : 'Entered Email is not associated to any account please check your email again!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
        
      }
    }else{

      var responseArray = {

        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {

      'status' : 'Headers Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }

})

router.post('/pinResetEmailCodeSend', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address =   (req.body.email_address).trim();
      let emailExist    =   await helperCon.findEmailExists(email_address);

      if(emailExist > 0 ){
        
        let generatedEmailResponse  =   await helperCon.generateEmailConfirmationCodeSendIntoEmail(email_address);
        if(generatedEmailResponse == true){
          var responseArray = {
            'status' : 'confirmation code are successfully sended your email which are associated with your account!',
            'type'   : 200
          };
          res.status(200).send(responseArray)
        }else{
          var responseArray = {

            'status' : 'SomeThing Went Wrong!',
            'type'   : 404
          };
          res.status(404).send(responseArray);
        }

      }else{

        var responseArray = {

          'status' : 'Entered Email is not associated to any account please check your email again!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
        
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Header Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray); 
  }
})

router.post('/codeVarification', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address = (req.body.emial_address).trim();
      let code          = parseFloat(req.body.code);

      let emailExist    =   await helperCon.findEmailExists(email_address);
      if(emailExist > 0){

        let codeStatusCheck = await helperCon.codeVarify(email_address, code)
        if(codeStatusCheck > 0){
          
          var responseArray = {

            'status' : 'Code are successfully matched!',
            'type'   : 200
          };
          res.status(200).send(responseArray); 
        }else{
          var responseArray = {

            'status' : 'Code are not matched or code are expired!',
            'type'   : 403
          };
          res.status(403).send(responseArray); 

        }
        // console.log(codeStatusCheck)
      }else{
        var responseArray = {

          'status' : 'Entered Email is not associated to any account please check your email again!',
          'type'   : 403
        };
        res.status(403).send(responseArray);    
      }
    }else{

      var responseArray = {

        'status' : 'Entered Email is not associated to any account please check your email again!',
        'type'   : 403
      };
      res.status(403).send(responseArray);    
    }

  }else{
    var responseArray = {

      'status' : 'Entered Email is not associated to any account please check your email again!',
      'type'   : 403
    };
    res.status(403).send(responseArray);    
  }

})

router.post('/updatePasswordProcess', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let email_address        =   (req.body.email_address).trim();
      let new_passwrod         =   (req.body.new_passwrod).toString();
      let confirmed_password   =   (req.body.confirmed_password).toString();

      let emailExist    =   await helperCon.findEmailExists(email_address);
      if(emailExist > 0 && email_address.length > 0 && new_passwrod === confirmed_password){

        let NewPasswordUpdate = await helperCon.passwordUpdateProcess(email_address, new_passwrod);

        if(NewPasswordUpdate == true){

          var responseArray = {

            'status' : 'Your New Password is SuccessFully Updated!',
            'type'   : 200,
            'newPass': req.body.new_passwrod
          };
          res.status(200).send(responseArray);

        }else{

          var responseArray = {
            'status' : 'Not Updated!',
            'type'   : 403
          };
          res.status(403).send(responseArray);

        }

      }else{

        var responseArray = {
          'status' : 'Some Thing Went Wrong!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }

    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);

    }
  }else{

    var responseArray = {
      'status' : 'Headers Missing!!!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

router.post('/updatePinProcess', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      let email_address   =   (req.body.email_address).trim();
      let new_pin         =   (req.body.new_pin).toString();
      let confirmed_pin   =   (req.body.confirmed_pin).toString();

      let emailExist    =   await helperCon.findEmailExists(email_address);
      if(emailExist > 0 && email_address.length > 0 && new_pin === confirmed_pin){

        let NewPinUpdate = await helperCon.pinUpdateProcess(email_address, new_pin);
        if(NewPinUpdate == true){

          let response = {
            status : "Pin Successfully Updated!",
            type   : 200,
            newPin : req.body.new_pin
          }
          res.status(200).send(response)
        }else{

          let response = {

            status: "Not Updated!",
            type  : 403
          }
          res.status(403).send(response)
        }
      }else{
        var responseArray = {
        
          'status' : 'oops Some Thing Went Wrong!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }
});


router.post('/uploadProfileImage', upload.single("file"), async function(req, res, next){

  if(req.headers.authorization){

    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      if(req.body.user_id){

        let image  = req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :"" ;
        let user_id = req.body.user_id.toString()

        
        let db = await conn;
        let userData =  await db.collection('users').find({ _id : new objectId(user_id.toString() ) }).toArray()
        if(userData.length > 0){
                  
          let img_name = ["/var/www/html/crypto_stock_application/public/upload/" +  userData[0]['image']].toString();
        
          console.log('img', img_name)
          try {
    
            fs.unlinkSync(img_name);
            console.log('image Successfully deleted!')
          
          } catch (e) {
    
            console.log(e)
          }
        } //end if      
    
        let statusUpload = await helperCon.uploadFileImage(image, user_id)
        if(statusUpload > 0){

          var responseArray = {
            'status' : 'Profile Image Successfully Uploaded!!!',
            'type'   : 200
          };
          res.status(200).send(responseArray);

        }else{

          var responseArray = {
            'status' : 'Profile Image not Uploaded!!!',
            'type'   : 404
          };
          res.status(404).send(responseArray);
        }

      }else{

        var responseArray = {
          'status' : 'user_id is Missing!!!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authorization Failled!!!',
        'type'   : 404
      };
      res.status(404).send(responseArray);
    }
  }else{
    
    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 404
    };
    res.status(404).send(responseArray);
  }
})


/////////////////////////////////////////////////////////////////////// End Account Api's /////////////////////////////////////////////////////////////






/////////////////////////////////////////////////////////////////////// News Tags /////////////////////////////////////////////////////////////////


//add user tags
router.post('/addUserTags', async function(req, res, next){
  if( req.body.user_id && req.body.tag_id){
    let user_id   = req.body.user_id;
    let tag_name  = req.body.tag_name;
    let tag_id    = req.body.tag_id;

    let insertedCount = await helperCon.insertOrDeleteUserTag(user_id, tag_name, tag_id)
    if(insertedCount){

      var responseArray = {
        data     :  insertedCount,
        'status' : 'Tag is Inserted Successfully!',
        'type'   : 200
      };

      res.status(200).send(responseArray)
    }else{

      var responseArray = {
        'status' : 'Something went wrong DB Issue!',
        'type'   : 403
      };
    }

    res.status(403).send(responseArray)
  }else{

    var responseArray = {
      'status' : 'user id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})

//get user tags
router.post('/getUserTags', async function(req, res, next){
  if( req.body.user_id){
    let user_id = req.body.user_id;

    let userTagData = await helperCon.getUserTag(user_id)
    res.status(200).send(userTagData)

  }else{

    var responseArray = {
      'status' : 'user id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})

/////////////////////////////////////////////////////////////////////// End News Tag ////////////////////////////////////////////////////////////////






/////////////////////////////////////////////////////////////////////// Buy Course /////////////////////////////////////////////////////////////////

//stripe payment gateway integuration
router.post('/paymentProcess', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      let admin_id          =   (req.body.admin_id).trim();
      let amount            =   (req.body.amount).trim();
      let currency          =   (req.body.currency).trim();
      let package_id        =   req.body.package_id;
      let description       =   req.body.description;
      let expiryMonth       =   (req.body.expiryMonth).trim();
      let expiryYear        =   (req.body.expiryYear).trim();
      let cardNumber        =   req.body.cardNumber;
      let cvc               =   req.body.cvc;
      let course_id         =   req.body.course_id.toString()
      
      let getUsers = await helperCon.getUserDetails(admin_id)

      if(getUsers.length > 0 ){

        const stripe = Stripe('sk_test_3fZ4URF5atT2vh24sYcZ5bkM00CadAsfDT');
          const customer = await stripe.customers.create({
          email   : getUsers[0].email_address,
          name    : getUsers[0].username,
        });

        // create token
        const token = await stripe.tokens.create({
          card: {
            number: cardNumber,
            exp_month: expiryMonth,
            exp_year: expiryYear,
            cvc: cvc,
          },
        }).catch((e)=> {

          var responseArray = {
            'status' : e.raw.code,
            'type'   : 404
          };
          res.status(404).send(responseArray);

        });

        stripe.charges.create({
          amount    :   amount,
          currency  :   currency,
          source    :   token.id,
          metadata  :   {'package': package_id},
          description : description,
          // customer  :   customer.id, 

        }).then(async(charge) => {

          let inserted_array = {
            name            : getUsers[0].nickName,
            email           : getUsers[0].email_address,
            admin_id        : admin_id,
            phone_number    : getUsers[0].phone_number,
            course_amount   : amount,
            subscription_title   : description,
            currency        : currency,
            status          : charge.status,
            payment_method  : charge.payment_method,
            course_id       : req.body.course_id  //if 0 month 1 year else course id

            
          }
          
          let db = await conn
          db.collect
          db.collection('payment_details').insertOne(inserted_array, async(err, result) =>{
            if(err){
              var responseArray = {
                'status' : 'database error',
                'type'   : 404
              };
              res.status(404).send(responseArray);
            }else{

              let status  = await helperCon.getAndAddCourseDetails(admin_id, course_id, charge.status,amount)
              // if id then get couse id details and save in new collection 
              if(status == true){
                var responseArray = {
                  'status' : 'successfully paid and Courses are Added',
                  'type'   : 200
                };
                res.status(200).send(responseArray);
              }else{

                var responseArray = {
                  'status' : 'successfully paid but Courses are not Added',
                  'type'   : 200
                };
                res.status(200).send(responseArray);
              }

            }
          });

        }).catch((e) => {
          var responseArray = {
            'status' : e.raw.message,
            'type'   : 404
          };
          res.status(404).send(responseArray);
        });
      }else{
        var responseArray = {
          'status' : 'user id wrong',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})

//get users all payment details 
router.get('/getAllPaymentDetails', async function(req, res){

  let details = await helperCon.getPaymentDetails()
  if(details.length >= 0 ){

    var responseArray = {

      data   : details,
      type   : 200
    };
    res.status(200).send(responseArray);

  }else{

    var responseArray = {
      'status' : 'Data Not Found!',
      'type'   : 200
    };
    res.status(200).send(responseArray);
  }

})

/////////////////////////////////////////////////////////////////////// end Buy Course //////////////////////////////////////////////////////////////






/////////////////////////////////////////////////////////////////////// Buy Details /////////////////////////////////////////////////////////////////

//get users subscriptions
router.post('/getUserSubscriptions', async function(req, res, next){

  if( req.body.user_id){
    
    let userSubscriptionsData =  await helperCon.getUserSubscriptionUsingId(req.body.user_id)
    
    var responseArray = {
      data   : userSubscriptionsData,
      type   : 200
    };
    res.status(200).send(responseArray);

  }else{

    var responseArray = {
      'status' : 'User Id are missing!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})


//get month/year users subscriptions
router.post('/getMonthYearUserSubscriptions', async function(req, res, next){

  if( req.body.user_id){
    
    let userSubscriptionsData =  await helperCon.getSubscriptionUsingId(req.body.user_id)
    
    var responseArray = {
      data   : userSubscriptionsData,
      type   : 200
    };
    res.status(200).send(responseArray);

  }else{

    var responseArray = {
      'status' : 'User Id are missing!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})

//get all users account details
router.get('/getAllUsersDetails', async function(req, res){

  let users = await helperCon.getAllUsersAccounts()
  if(users.length >= 0){

    var responseArray = {

      data   : users,
      type   : 200
    };
    res.status(200).send(responseArray);
  }else{
    
    var responseArray = {
      'status' : 'Data Not Found!',
      'type'   : 200
    };
    res.status(200).send(responseArray);
    
  }
})

/////////////////////////////////////////////////////////////////////// End Buy Details ///////////////////////////////////////////////////////////////







/////////////////////////////////////////////////////////////////////// Property Assert Details ////////////////////////////////////////////////////////

//adding property
router.post('/insertPropertyDetails',upload.single("file"), async function (req, res,next) {
  if( req.body.user_id){
    var data = {
      property_name     : req.body.property_name,
      reference_number  : req.body.reference_number,
      property_address  : req.body.property_address,
      property_type     : req.body.property_type,
      full_paid         : req.body.full_paid,
      mortgage          : req.body.mortgage,
      total_amount      : parseFloat(req.body.total_amount),
      paid_for_it       : parseFloat(req.body.paid_for_it),
      mortgage_per_month: parseFloat(req.body.mortgage_per_month),
      month_remaning    : parseFloat(req.body.month_remaning),
      user_id           : req.body.user_id.toString(),
      latest_value      : parseFloat(req.body.latest_value),
      income_from_it    : parseFloat(req.body.income_from_it),
      image      : req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    };
    // console.log(data)
    let insertedCount =  await helperCon.insertProperty(data);
    if(insertedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully inserted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not Inserted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//getting property
router.post('/getPropertyDetails', async function (req, res,next) {
  
  if( req.body.user_id && req.body.pageNumber){

    let user_id     = req.body.user_id.toString();
    let pageNumber  = parseInt(req.body.pageNumber)

    let getUserAssertsDetails =  await helperCon.getProperty(user_id, pageNumber);

    if(getUserAssertsDetails){
      var responseArray = {
        status          : 'Records Fetched Successfully',
        propertyDetails : getUserAssertsDetails ,
        type            : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id or pageNumber is missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//Edit property
router.post('/editPropertyDetails', upload.single("file"), async function (req, res,next) {
  
  if( req.body.user_id && req.body.property_id){
    var admin_id = req.body.user_id;
    var propertyId = req.body.property_id;

    let data = {
      property_name     : req.body.property_name,
      reference_number  : req.body.reference_number,
      property_address  : req.body.property_address,
      property_type     : req.body.property_type,
      full_paid         : req.body.full_paid,
      mortgage          : req.body.mortgage,
      total_amount      : parseFloat(req.body.total_amount),
      paid_for_it       : parseFloat(req.body.paid_for_it),
      mortgage_per_month: parseFloat(req.body.mortgage_per_month),
      month_remaning    : parseFloat(req.body.month_remaning),
      user_id           : req.body.user_id.toString(),
      latest_value      : parseFloat(req.body.latest_value),
      income_from_it    : parseFloat(req.body.income_from_it),
      image             : req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    }
    //get file name and delete from server
    let whereEditSearch = {
      user_id : admin_id.toString(),
      _id     : new objectId(propertyId.toString())  
    }
    let db = await conn;
    db.collection('property_details').find(whereEditSearch, async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result  = await response.toArray()         
        let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }

    })
    //////// delete Image from server end 
    let modifiedCount =  await helperCon.editProperty(data, admin_id, propertyId);
    if(modifiedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully updated',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not updated!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id and property_id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});


//delete property
router.post('/deletePropertyDetails', async function (req, res,next) {
  
  if( req.body.user_id && req.body.property_id){
    var admin_id = req.body.user_id;
    var propertyId = req.body.property_id;
  
    //get file name and delete from server
    let whereEditSearch = {
      user_id : admin_id.toString(),
      _id     : new objectId(propertyId.toString())  
    }
    let db = await conn;
    db.collection('property_details').find(whereEditSearch, async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result  = await response.toArray()         
        let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }
    })
    //////// delete Image from server end 

    let deletedCount =  await helperCon.deleteProperty(admin_id, propertyId);
    if(deletedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully deleted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not deleted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id or property_id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//get user All asserts sum
router.post('/getUserAssetTotal', async function (req, res,next) {
  if( req.body.user_id ){
    let user_id  = req.body.user_id.toString();           
    let userSum =  await helperCon.getUserAssertsSum(user_id);

    if(userSum){
      var responseArray = {
        status          : 'Records Fetched Successfully',
        sum             : userSum ,
        type            : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

/////////////////////////////////////////////////////////////////////// End Property Assert Details //////////////////////////////////////////////////////







/////////////////////////////////////////////////////////////////////// preciousMetal Assert Details /////////////////////////////////////////////////////

//adding preciousMetal
router.post('/preciousMetal',upload.single("file"), async function(req, res, next){

  if( req.body.user_id ){

    var data = {
      metal_name            :   req.body.metal_name,
      qty_per_unit          :   parseFloat(req.body.qty_per_unit),
      price_paid_for_it     :   parseFloat(req.body.price_paid_for_it),
      current_market_price  :   parseFloat(req.body.current_market_price),
      user_id               :   req.body.user_id.toString(),
      image                 :   req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    };
    let insertedCount =  await helperCon.insertpreciousMetalHelper(data);
    if(insertedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully inserted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not Inserted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})

//get precious Metal
router.post('/getPreciousMetal', async function(req, res, next){

  if( req.body.user_id && req.body.pageNumber ){

    let user_id  =   req.body.user_id.toString();
    let pageNumber = req.body.pageNumber
      
    let getUserAssertsDetails =  await helperCon.getpreciousMetalHelper(user_id, pageNumber);
    if(getUserAssertsDetails){

      var responseArray = {
        status                : 'Records Fetched Successfully',
        PreciousMetalDetails  : getUserAssertsDetails ,
        type                  : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id or pageNumber are missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})

//Edit Precious Metal
router.post('/editPreciousMetal', upload.single("file"), async function (req, res,next) {
  
  if( req.body.user_id && req.body.precious_metal_id){
    var admin_id = req.body.user_id;
    var precious_metal_id = req.body.precious_metal_id;

    let data = {
      metal_name            :   req.body.metal_name,
      qty_per_unit          :   parseFloat(req.body.qty_per_unit),
      price_paid_for_it     :   parseFloat(req.body.price_paid_for_it),
      current_market_price  :   parseFloat(req.body.current_market_price),
      user_id               :   req.body.user_id.toString(),
      image                 :   req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    }

    //get file name and delete from server
    let whereEditSearch = {
      user_id : admin_id.toString(),
      _id     : new objectId(precious_metal_id.toString())  
    }
    let db = await conn;
    db.collection('precious_metal').find(whereEditSearch, async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result   = await response.toArray()         
        let img_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }
    })
    //////// delete Image from server end 

    let modifiedCount =  await helperCon.edit_preciousMetal(data, admin_id, precious_metal_id);
    if(modifiedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully updated',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not updated!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id and precious_metal_id is missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//delete precious metal
router.post('/deletePreciousMetal', async function (req, res,next) {
  
  if( req.body.user_id && req.body.Precious_metal_id){
    var admin_id = req.body.user_id;
    var Precious_metal_id = req.body.Precious_metal_id;
  
    //get file name and delete from server
    let whereEditSearch = {
      user_id : admin_id.toString(),
      _id     : new objectId(precious_metal_id.toString())  
    }

    let db = await conn;
    db.collection('market_share').find(whereEditSearch, async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result   = await response.toArray()         
        let img_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }
    })
    //////// delete Image from server end 

    let deletedCount =  await helperCon.deletePreciousMetals(admin_id, Precious_metal_id);
    if(deletedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully deleted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not deleted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id or Precious_metal_id is missing in your payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

/////////////////////////////////////////////////////////////////////// End precious Metal Assert Details ///////////////////////////////////////////







/////////////////////////////////////////////////////////////////////// Market Stack Assert Details /////////////////////////////////////////////////

//adding market share
router.post('/marketShare',upload.single("file"), async function(req, res, next){

  if( req.body.user_id){
    var data = {
      company_name          :   req.body.company_name,
      share_per             :   parseFloat(req.body.share_per),
      price_paid_for_it     :   parseFloat(req.body.price_paid_for_it),
      current_market_price  :   parseFloat(req.body.current_market_price),
      user_id               :   req.body.user_id.toString(),
      image                 :   req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    };
    let insertedCount =  await helperCon.insertMarketSharelHelper(data);
    if(insertedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully inserted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not Inserted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  
  }else{
    var responseArray = {
      'status' : 'user is missing please send user id in payload!',
      'type'   : 403
    };
  }

})

//getting MarketShare
router.post('/getMarketShare', async function (req, res,next) {
  
  if( req.body.user_id && req.body.pageNumber ){

    let user_id    = req.body.user_id.toString();
    let pageNumber = req.body.pageNumber;
           
    let getMarketShare =  await helperCon.getMarketShareHelper(user_id, pageNumber);
    if(getMarketShare){
      var responseArray = {
        status                : 'Records Fetched Successfully',
        getMarketShareDetails : getMarketShare ,
        type                  : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user id or pageNumber are missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//edit market share
router.post('/editMarketShare',upload.single("file"), async function(req, res, next){

  if(req.body.id){
    let idd = req.body.id;
    var data = {
      company_name          :   req.body.company_name,
      share_per             :   req.body.share_per,
      price_paid_for_it     :   parseFloat(req.body.price_paid_for_it),
      current_market_price  :   parseFloat(req.body.current_market_price),
      user_id               :   req.body.user_id.toString(),
      image                 :   req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
    };

    //get file name and delete from server
    let db = await conn;
    db.collection('market_share').find({_id : new objectId(req.body.id.toString())}, async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result   = await response.toArray()         
        let img_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }
    })
    //////// delete Image from server end

    let updatedCount =  await helperCon.updateMarketSharelHelper(data, idd);
    if(updatedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully Updated',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not Updated!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  
  }else{
    var responseArray = {
      'status' : 'id is missing please send in payload!',
      'type'   : 403
    };
  }

})

//delete Market Share
router.post('/deleteMarketShare', async function (req, res,next) {
  
  if( req.body.MarketShare_id){

    var MarketShare_id = req.body.MarketShare_id;
  
    //get file name and delete from server
    let db = await conn;
    db.collection('market_share').find( {_id : new objectId(MarketShare_id.toString())} , async(err, response) => { 
      if(err){
  
        console.log('error in db')
      }else{
  
        let result   = await response.toArray()         
        let img_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      
        console.log('img', img_name)
        try {
  
          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        
        } catch (e) {
  
          console.log(e)
        }
      }
    })
    //////// delete Image from server end 

    let deletedCount =  await helperCon.deleteMarket_share(MarketShare_id);
    if(deletedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully deleted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not deleted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'MarketShare_id is missing in your payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//get market stack data
router.post('/getMarketStackData', async function(req, res){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;

    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){

      console.log(req.body)
      let symbolGet = req.body.symbol
      let pageNumber = req.body.pageNumber

      let dataReturn = await helperCon.getMarketStack(pageNumber, symbolGet);

      if(dataReturn.length > 0 ) {

        let response = {
          data      : dataReturn,
          type      : 200
        }

        res.status(200).send(response)

      }else{

        let response = {
          status    : 'Record Not Found!!!',
          type      : 403
        }

        res.status(403).send(response)
      }
    }else{

      var responseArray = {
        status : 'Authentication Failed!!!',
        type   : 403
      };
      res.status(403).send(responseArray)
    }
  }else{
    var responseArray = {
      status : 'Headers are Missing!!!',
      type   : 403
    };
    res.status(403).send(responseArray)
  }
})


/////////////////////////////////////////////////////////////////////// End Market Stack Assert Details ////////////////////////////////////////////







/////////////////////////////////////////////////////////////////////// Crypto Assert Details ////////////////////////////////////////////////////

//adding crypto
router.post('/addingCrypto', async function(req, res, next){

  if( req.body.user_id){
    var data = {
      coin                 :   req.body.coin,
      quantity             :   parseFloat(req.body.quantity),
      price_paid_for_it    :   parseFloat(req.body.price_paid_for_it),
      current_market_price :   parseFloat(req.body.current_market_price),
      user_id              :   req.body.user_id.toString(),
      image                :   req.body.image.toString(),
      name                 :   req.body.name.toString(),
      slug                 :   req.body.slug.toString() 

    };

    let user_id =   req.body.user_id.toString();
    let coin    =  req.body.coin;

    let insertedCount =  await helperCon.insertCryptoAsserts(data, user_id, coin);
    if(insertedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully inserted',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not Inserted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }


  }else{
    var responseArray = {
      'status' : 'user is missing please send user id in payload!',
      'type'   : 403
    };
  }
})

//getting Crypto only users
router.post('/GetCrypto', async function (req, res,next) {
  
  if( req.body.user_id){

    let user_id     = req.body.user_id.toString()
    let pageNumber  = req.body.pageNumber;
    let searchSymbol= req.body.searchSymbol

    let getUserAssertsDetails;
    if(searchSymbol) {

      console.log('if=====================>>>>>>>>>>>>>>>>>>')
      getUserAssertsDetails =  await helperCon.getCryptoAssertsSearch(user_id, searchSymbol);
      
    }else{

      getUserAssertsDetails =  await helperCon.getCryptoAsserts(user_id, pageNumber);
     
    }

    if(getUserAssertsDetails){
      var responseArray = {
        status          : 'Records Fetched Successfully',
        propertyDetails : getUserAssertsDetails ,
        type            : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user_id is missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//getting Crypto by user Id
router.post('/GetCryptoByUserId', async function (req, res,next) {
  
  if( req.body.user_id  && req.body.pageNumber){
    

    let user_id  = req.body.user_id.toString();
    let pageNumber  = parseInt(req.body.pageNumber);
           
    let getUserAssertsDetails =  await helperCon.getCryptoAssertsByUserId(user_id, pageNumber);
    if(getUserAssertsDetails.length > 0){
      var responseArray = {
        status          : 'Records Fetched Successfully',
        propertyDetails : getUserAssertsDetails ,
        type            : 200
      };
      res.status(200).send(responseArray);

    }else{
      
      var responseArray = {
        'status' : 'No Data Found!!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'user id or pagenumber is missing please send in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

});

//upload coin image api
router.post('/addingCoinSymbol', upload.single("file"),async function (req, res, next){

  var symbol    = req.body.symbol;
  var coin_img  = req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :""
  
  let modifiedCount = await helperCon.coin_symbol_inserted(symbol, coin_img)
  if(modifiedCount > 0 ){
    
    var responseArray = {
      'status' : 'Image Successfully uploaded',
      'type'   : 200
    };
    res.status(200).send(responseArray);

  }else{

    var responseArray = {
      'status' : 'Some Thing Went Wrong not uploaded!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})

//get crypto asserts
router.post('/coinList', async function(req, res, next){

  if( req.body.user_id){
    let user_id = req.body.user_id;

    let dataAsserts = await helperCon.getCryptoAsserts(user_id)
    res.status(200).send(dataAsserts)
  }else{

    var responseArray = {
      'status' : 'user id is missing please send user id in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
});

//delete Crypto
router.post('/deleteCrypto', async function (req, res,next) {
  
  if( req.body.crypto_id){

    var crypto_id = req.body.crypto_id;
  
    let deletedCount =  await helperCon.deleteCrypto_assert(crypto_id);
    if(deletedCount > 0){

      var responseArray = {
        'status' : 'Record Successfully deleted!',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      var responseArray = {
        'status' : 'Some Thing Went Wrong not deleted!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'crypto_id is missing in your payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
});

//market chart data
router.post('/getMarketChartData', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      if(req.body.coin_name && req.body.timeDuration){

        let coin_name = req.body.coin_name.toString();
        let timeDuration =   req.body.timeDuration.toString()

        let Stringlength = (timeDuration.length)
        let first;
        let second;
        if(Stringlength == 2){

          const chars = timeDuration.split('');
          first  = chars[0];
          second = chars[1];
          second = second[0].toUpperCase() + second.slice(1)
        }else if(Stringlength == 3){

          const chars = timeDuration.split('');
          
          first  = chars.slice(0, 2); 
          second = chars[2];
          second = second[0].toUpperCase() + second.slice(1)

          first = str_replace(',', '', first)
        }else{

          var responseArray = {
            'status' : 'This Case Not Handeled Please Discuss With Your Backend Engineer!!!',
            'type'   : 403
          };
          res.status(403).send(responseArray);
          // res.end()
          res.writeHead(statusCode) // for make the call end 
        }

        let dataResponse = await helperCon.getChartData(coin_name, first, second ) 

        var responseArray = {
          data   : dataResponse,
          type   : 200
        };
        res.status(200).send(responseArray);

      }else{

        var responseArray = {
          'status' : 'Parameter are Missing!!!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})


router.post('/marketPricesPreciousMetal', async function(req, res, next){

  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      if(req.body.metal_name && req.body.timeDuration){

        let metal_name = req.body.metal_name.toString();
        let timeDuration =   req.body.timeDuration.toString()
      
        let Stringlength = (timeDuration.length)
        let first;
        let second;
        if(Stringlength == 2){

          const chars = timeDuration.split('');
          first  = chars[0];
          second = chars[1];
          second = second[0].toUpperCase() + second.slice(1)
        }else if(Stringlength == 3){

          const chars = timeDuration.split('');
          
          first  = chars.slice(0, 2); 
          second = chars[2];
          second = second[0].toUpperCase() + second.slice(1)

          first = str_replace(',', '', first)
        }else{

          var responseArray = {
            'status' : 'This Case Not Handeled Please Discuss With Your Backend Engineer!!!',
            'type'   : 403
          };
          res.status(403).send(responseArray);
          // res.end()
          res.writeHead(statusCode) // for make the call end 
        }

        let dataResponse = await helperCon.getmarketPricesPreciousMetal(metal_name, first, second ) 

        var responseArray = {
          data   : dataResponse,
          type   : 200
        };
        res.status(200).send(responseArray);

      }else{

        var responseArray = {
          'status' : 'Parameter are Missing!!!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})




























router.post('/getMarketShareData', async function(req, res, next){
  
  if(req.headers.authorization){
    let credentialsGet = await helperCon.getBasicAuthCredentials()

    let username = credentialsGet.username;
    let password = credentialsGet.password;
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const userDetails = credentials.split(':');

    let usernameApi = md5(userDetails[0])
    let passwordApi = md5(userDetails[1])

    if(username === usernameApi   &&  password == passwordApi){
      if(req.body.symbol && req.body.timeDuration){
        
        

        let symbol = req.body.symbol.toString();
        let timeDuration =   req.body.timeDuration.toString()

        let Stringlength = (timeDuration.length)
        let first;
        let second;
        if(Stringlength == 2){

          const chars = timeDuration.split('');
          first  = chars[0];
          second = chars[1];
          second = second[0].toUpperCase() + second.slice(1)
        }else if(Stringlength == 3){

          const chars = timeDuration.split('');
          
          first  = chars.slice(0, 2); 
          second = chars[2];
          second = second[0].toUpperCase() + second.slice(1)

          first = str_replace(',', '', first)
        }else{

          var responseArray = {
            'status' : 'This Case Not Handeled Please Discuss With Your Backend Engineer!!!',
            'type'   : 403
          };
          res.status(403).send(responseArray);
          // res.end()
          res.writeHead(statusCode) // for make the call end 
        }

        let dataResponse = await helperCon.getChartMarketData(symbol, first, second ) 

        var responseArray = {
          data   : dataResponse,
          type   : 200
        };
        res.status(200).send(responseArray);

      }else{

        var responseArray = {
          'status' : 'Parameter are Missing!!!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }
    }else{

      var responseArray = {
        'status' : 'Authentication Failed!!!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{
    var responseArray = {
      'status' : 'Headers are Missing!!!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})





















/////////////////////////////////////////////////////////////////////// End Crypto Assert Details //////////////////////////////////////////////////








///////////////////////////////////////////////////////////////////////  Lesson Details //////////////////////////////////////////////////


//edit lession
router.post('/editLession', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]) ,async function(req, res, next){

  if( req.body.id && req.body.indexNumber){
    
    let newData = {
      course_id   : req.body.course_id, 
      title       : req.body.title,
      description : req.body.description,
      image       : (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) : req.body.image.toString(),
      video       : (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : req.body.video.toString(),
    }

    let idd         = req.body.id.toString(); 
    let indexNumber = req.body.indexNumber;

    let db = await conn;
    db.collection('courses').find({_id: new objectId(idd.toString())}, async(err, response) => {
      if(err){

        console.log('error in db')
      }else{

        let result  = await response.toArray() 
       
        let imgName   = result[0]['lessons'][indexNumber]['image'].toString();
        let videoName = result[0]['lessons'][indexNumber]['video'].toString()

        let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][indexNumber]['image']].toString();
        let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][indexNumber]['video']].toString();
        
        try {

          if(videoName){

            fs.unlinkSync(video_name);
            console.log('video Successfully deleted!')
          }
          if(imgName){

            fs.unlinkSync(img_name);
            console.log('image Successfully deleted!')
          }
        
        } catch (e) {

          console.log(e)
        }
      }
            
    })

    let modifiedCount = await helperCon.editLessions(newData ,idd, indexNumber)

    if(modifiedCount > 0){

      var responseArray = {
        'status' : 'Successfully Updated!',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      
      var responseArray = {
        'status' : 'not updated something are wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
      
    }
  }else{

    var responseArray = {
      'status' : '_id or index number is missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})


//delete lession
router.post('/deleteLession', async function(req, res, next){

  if( req.body.id && req.body.course_id){

    let idd         = req.body.id.toString(); 
    let course_idd  = req.body.course_id.toString();


    let db = await conn;
    db.collection('courses').find({_id: new objectId(idd.toString())}, async(err, response) => {
      if(err){

        console.log('error in db')
      }else{

        let result  = await response.toArray() 
        for(var i= 0 ; i < result[0]['lessons'].length; i++){

          if(result[0]['lessons'][i]['course_id'] == course_idd){

            let imgName   = result[0]['lessons'][i]['image'].toString();
            let videoName = result[0]['lessons'][i]['video'].toString()

            let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][i]['image']].toString();
            let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][i]['video']].toString();
            
            try {
    
              if(videoName){

                fs.unlinkSync(video_name);
                console.log('video Successfully deleted!')
              }
              if(imgName){

                fs.unlinkSync(img_name);
                console.log('image Successfully deleted!')
              }
            
            } catch (e) {

              console.log(e)
            }
          }
            
        }//end loop
      }//end else
    })

    let deletedCount = await helperCon.deleteLessions(idd, course_idd)

    if(deletedCount > 0){

      var responseArray = {
        'status' : 'Successfully Deleted!',
        'type'   : 200
      };
      res.status(200).send(responseArray);

    }else{
      
      var responseArray = {
        'status' : 'not deleted something are wrong!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
      
    }
  }else{

    var responseArray = {
      'status' : 'id  or course oid is missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }
})



/////////////////////////////////////////////////////////////////////// End Crypto Assert Details //////////////////////////////////////////////////




router.get('/sendEmail', async function(req, res, next){

  let transporter = nodemailer.createTransport({
    service : 'gmail',
    host: 'smtp.gmail.com',
    secure: false, 
    auth: {
      user: 'asim22578@gmail.com', // generated ethereal user
      pass: 'Allahisone$', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'asim22578@gmail.com', // sender address
    to: "asim92578@gmail.com", // list of receivers
    subject: "Testing", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });
  console.log("Message sent: %s", info.messageId);
})



router.get('/getAllCategories', async function (req, res) {

  let db = await conn;
  let lookupQuery = [
    {
      '$group':{
        // '_id' : '$category',

        "_id": {
          "category": "$category",
          "courseplan": "$courseplan"
        },

        'free_lesson' : {
          '$sum' : {
            '$cond' : {
              'if' : {'$eq' : ['$courseplan' , 'free']},
              'then' : {'$sum': { $size: "$lessons" }},
              'else' : 0,
            }
          }
        },

        'master_lesson' : {
          '$sum' : {
            '$cond' : {
              'if' : {'$eq' : ['$courseplan' , 'master']},
              'then' : {'$sum': { $size: "$lessons" }},
              'else' : 0,
            }
          }
        }
      }
    },

  ];

  let category = await db.collection('courses').aggregate(lookupQuery).toArray()

  console.log(category);
  const categorydata ={
    status:"200",
    category: category,
  
  }
 res.send(categorydata);

});





/////////////////////////////////////////////// Start Liabilities ///////////////////////////////////////////////////////////////////////////////

//CURD
router.post('/liabilities', async function(req, res, next){
  if(req.body.type){
    let type = req.body.type; // 1 insert 2 update 3 delete
    if(type == 1 || type == '1') {
      //insert
      let insertData = {
        name   : req.body.name, 
        price  : req.body.price,
        user_id: req.body.user_id
      }
      let result = await helperCon.addingLiability(insertData)
      if(result > 0){
  
        var responseArray = {
          'status' : 'Successfully Added!',
          'type'   : 200
        };
        res.status(200).send(responseArray);
      }else{
  
        var responseArray = {
          'status' : 'SomeThing went wrong!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
  
      }

    }else if(type == 2 || type == '2'){
      //update
      let newData = {
        name   : req.body.name, 
        price  : req.body.price,
        user_id: req.body.user_id
      }
      let name1 =  req.body.name;
      let result = await helperCon.updateLiability(newData, name1)
      if(result > 0){
  
        var responseArray = {
          'status' : 'Successfully Updated!',
          'type'   : 200
        };
        res.status(200).send(responseArray);
      }else{
  
        var responseArray = {
          'status' : 'SomeThing went wrong!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }


    }else if(type == 3 || type == '3'){
      //delete
      let _name = req.body.name;
    
      let result = await helperCon.deleteLiability(_name)
      if(result > 0){

        var responseArray = {
          'status' : 'Successfully Deleted!',
          'type'   : 200
        };
        res.status(200).send(responseArray);
      }else{

        var responseArray = {
          'status' : 'SomeThing went wrong!',
          'type'   : 403
        };
        res.status(403).send(responseArray);
      }
    }
  
  }else{

    var responseArray = {
      'status' : 'Type are missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})

//get
router.post('/getLiabilities', async function(req, res, next){

  if(req.body.user_id && req.body.pageNumber){

    let user_id    = req.body.user_id
    let pageNumber = parseInt(req.body.pageNumber)

    let result = await helperCon.getLiability(user_id, pageNumber)
    if(result.length > 0){

      var responseArray = {
        data   : result,
        type   : 200
      };
      res.status(200).send(responseArray);
    }else{

      var responseArray = {
        'status' : 'Records not Found!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  }else{

    var responseArray = {
      'status' : 'user_id or pageNumber are missing in payload!',
      'type'   : 403
    };
    res.status(403).send(responseArray);
  }

})

///////////////////////////////////////////// END Liabilities ////////////////////////////////////////////////////////////////////////////////// 








/////////////////////////////////////////////////////////////////////// Asserts Sold Details ///////////////////////////////////////////////////////////////


  //sold the asserts

  router.post('/assertsSold', async function(req, res, next){

    if( req.body.id && req.body.sell_price && req.body.type){

      let sell_price =  parseFloat(req.body.sell_price);
      let idd        =  req.body.id;
      let type       =  req.body.type;

      let soldCount = await helperCon.makeItSold(sell_price, idd, type)
      if(soldCount > 0){

        var responseArray = {
          'status' : 'Sold Successfully!',
          'type'   : 200
        };
        res.status(200).send(responseArray);
      }else{

        var responseArray = {
          'status' : 'SomeThing went wrong!',
          'type'   : 404
        };
        res.status(404).send(responseArray);
      }

    }else{

      var responseArray = {
        'status' : 'id or sell price are missing in payload!',
        'type'   : 403
      };
      res.status(403).send(responseArray);
    }
  })


/////////////////////////////////////////////////////////////////////// End Asserts Sold Details ////////////////////////////////////////////////////////////






/////////////////////////////////////////////////////////////////////// Get News Details ////////////////////////////////////////////////////////////

//get news
router.post('/getNews', async function(req, res, next){

  let user_id1 = (req.body.user_id).toString()
  let tag_name = req.body.tag_name
  let pageNumber = req.body.pageNumber

  let newsResult  = await helperCon.getNewsDetails(user_id1, pageNumber, tag_name) 

  console.log(newsResult.length)

  if(newsResult.length > 0){

    var responseArray = {
      data : newsResult,
      type   : 200
    };
    res.status(200).send(responseArray);

  }else{

    var responseArray = {
      'status' : 'Record not Found!',
      'type'   : 404
    };
    res.status(200).send(responseArray);
  }

  
})

/////////////////////////////////////////////////////////////////////// End Get News Details ///////////////////////////////////////////////////////////





/////////////////////////////////////////////////////////////////////// Get Precious Matel Market Prices Details ///////////////////////////////////////



router.get('/get_precious_matelPrices', async function(req, res, next){


  let responsePrices = await helperCon.getPreciousMatelPrices()
  if(responsePrices.length > 0){

    var responseArray = {
      data   : responsePrices,
      type   : 200
    };
    res.status(200).send(responseArray);
  }else{

    var responseArray = {
      status : 'No Data Found!',
      type   : 403
    };
    res.status(200).send(responseArray);
  }

})

router.get('/get_currencies', async function(req, res, next){


  let responsePrices = await helperCon.getPreciousAllMatelPrices()
  
  console.log(responsePrices);
     
     
    
  if(responsePrices.length > 0){

    var responseArray = {
      data   : responsePrices[0],
      type   : 200
    };
    res.status(200).send(responseArray);
  }else{

    var responseArray = {
      status : 'No Data Found!',
      type   : 403
    };
    res.status(200).send(responseArray);
  }

})




/////////////////////////////////////////////////////////////////////// END Get Precious Matel Market Prices Details ///////////////////////////////////



//get marketstack company details
router.get('/getCompanyRecords',  async function(req, res){

  console.log('permission not Allowed')
  process.exit(0)
  let db = await conn;
  fetch('http://api.marketstack.com/v1/tickers?access_key=9a47531364a137d8b4a4a8c2f28ff0e5&limit=1000', {  
    method: 'GET',
    headers: { 
      'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
      'cache-control': 'no-cache',
      Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
      'Content-Type': 'application/json',
    }
  }).then(res => res.json())
  .then(async json => {
    let foopData = json.data
    console.log('count total: ', foopData.length)
    if(json.error){

      console.log(json.error)
    }
    for(var i= 0 ; i < foopData.length; i++){
      var arrayInserted = {

        name            : foopData[i]['name'],
        symbol          : foopData[i]['symbol'],
        stock_exchange  : foopData[i]['stock_exchange'],
        inserted_date   : new Date()
      }

      console.log(arrayInserted)

      let matchFind = { symbol: foopData[i]['symbol'] }
      await db.collection('market_stack_companies_name').updateOne(matchFind, {$set:  arrayInserted}, {upsert: true}, async(err, result) => {
        if(err){
          console.log('error')
        }else{

          console.log('modified count : ', await result.modifiedCount)
          console.log('upserted count : ', await result.upsertedCount)
        }
      })
  
    }//end loop
   
    console.log('Successfully Done!!!')

    // console.log(foopData)
  });
})


//get subscriptions detail is this user buy or not
router.post('/getSubscriptionStatus', async function(req, res, next){

  let user_id    =  req.body.user_id;
  let category   =  req.body.category
  let courseplan =  req.body.coursePlan
  let pageNumber =  parseInt(req.body.pageNumber)

  let status = await helperCon.getUserSubDetails(user_id, category, courseplan, pageNumber)
  if(status.length > 0){

    var responseArray = {
      data   : status,
      type   : 200
    };
    res.status(200).send(responseArray);
  }else{

    var responseArray = {
      'status' : 'No Courses Available!',
      'type'   : 400
    };
    res.status(200).send(responseArray);
  }

})

//file delete in a folder testing function
router.get('/imgDelete', async function(req, res, next){
  // let imageDelete  = await helperCon.singleImageDlt()
  try {
    fs.unlinkSync(`/var/www/html/crypto_stock_application/public/upload/Ramadan-Kareem-website.jpg`);

    res.status(201).send({ message: "Image deleted" });

  } catch (e) {
    res.status(400).send({ message: "Error deleting image!", error: e.toString(), req: req.body });
  }

})

router.get('/coinMarketCap', async function(req, res, next){

  coinmarketcap.multi(coins => {
    console.log(coins.get("BTC").price_usd); // Prints price of BTC in USD
    console.log(coins.get("ETH").price_usd); // Print price of ETH in USD
    console.log(coins.get("ETH").price_btc); // Print price of ETH in BTC
    console.log(coins.getTop(10)); // Prints information about top 10 cryptocurrencies
  });
});

router.get('/JwtToken', async function(req, res, next){
  let userData = {
    id        :   123,
    username  :   "asim",
    email     :   "asim22578@gmail.com",
    exp       :   Math.floor(Date.now() / 1000) + (60 * 60),   //expiration time is 1 hour
    iat       :   Math.floor(Date.now() / 1000) + (60 * 60),   //expiration time is 1 hour
  }

  let tocken ;
  jwtCreate.sign((userData), 'secretkey', {}, (err, token) => {

    // console.log(token);
    jwtCreate.verify(token, 'secretkey', (err, decoded)=> {
      if(err){

        console.log('error', err);
      }else {

        console.log('decoded',decoded) 
      }
    });
  })
  reate.verify(token, 'secretkey', (err, decoded)=> {
    //   console.log('decoded',decoded) // bar
  });
});

function uploadToS3(file) {
  let s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    Bucket: BUCKET_NAME
  });
  s3bucket.createBucket(function () {
      var params = {
        Bucket: BUCKET_NAME,
        Key: file.name,
        Body: file.data
      };
      s3bucketupload(params, function (err, data) {
        if (err) {
          console.log('error in callback');
          console.log(err);
        }
        console.log('success');
        console.log(data);
      });
  });
}

router.post('/bucket', async function(req, res, next){


  console.log('name', req.body.name);
  // process.exit(1);

  const BUCKET_NAME     = '';
  const IAM_USER_KEY    = '';
  const IAM_USER_SECRET = '';

  var busboy = new Busboy({ headers: req.headers });

  busboy.on('finish', function() {
  console.log('../upload finished');

    const file = req.files.element2;
    console.log('file', file);
    
    uploadToS3(file);
  });


});

//changlly.com requests
router.get('/changly', async function(req, res, next){


changelly.getCurrencies(function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('getCurrencies', data);
    }
  });

});

router.get('/createTransaction', async function(req, res, next){
  changelly.createTransaction('eth', 'btc', '1PKYrd9CC4RFB65wBrvaAsTWnp8fXePuj', 10, undefined, function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('createTransaction', data);
    }
  });

});

router.get('/getMinAmount', async function(req, res, next){

  changelly.getMinAmount('eth', 'btc', function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('getMinAmount', data);
    }
  });
});

router.get('/getExchangeAmount', async function(req, res, next){

  changelly.getExchangeAmount('btc', 'eth', 1, function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('getExchangeAmount', data);
    }
  });
});

router.get('/getTransactions', async function(req, res, next){

  changelly.getTransactions(10, 0, 'btc', undefined, undefined, function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('getTransactions', data);
    }
  });
});

router.get('/getStatus', async function(req, res, next){

  changelly.getStatus('1gy2g76', function(err, data) {
    if (err){
      console.log('Error!', err);
    } else {
      console.log('getStatus', data);
    }
  });
});

router.get('/payin', async function(req, res, next){

  changelly.on('payin', function(data) {
    console.log('payin', data);
  });
});

router.get('/payout', async function(req, res, next){

  changelly.on('payout', function(data) {
    console.log('payout', data);
  });
});

//binance
router.get('/getExchangeSymbol', async function(req, res, next){

  let db = await conn;
  fetch('https://api.pro.changelly.com/api/2/public/symbol', {
    method: 'GET',
    headers: { 
      'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
      'cache-control': 'no-cache',
      Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
      'Content-Type': 'application/json'  
    }
  }).then(res => res.json())
  .then(json => {
    json.forEach(async function(entry) {

      let arrayInsert = {
        
        symbol        :   entry.id,
        baseCurrency  :   entry.baseCurrency ,
        tickSize      :   entry.tickSize,
        quoteCurrency :   entry.quoteCurrency
      };

      let searchCriteria = {
        symbol  :   entry.id,
      }
      
      // db.collection('coins').updateOne(searchCriteria , {$set: arrayInsert}, {upsert : true}, (result, err) => {
      //   if(err){
      //     // console.log(err)
      //   }else{
      //     console.log('upserted count: ', result.upsertedCount )
      //     console.log('modified count: ', result.modifiedCount )
      //   }
      // })

      console.log(arrayInsert)

    }) //end loop

    console.log('successfully added all coins')
    // conn.close();
  
  });
});


// get coin market can symbol
router.get('/getExchangeSymbolNew', async function(req, res, next){

  let db = await conn;
  fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
    method: 'GET',
    headers: { 
      'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
      'cache-control': 'no-cache',
      Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
      'Content-Type': 'application/json',
      'X-CMC_PRO_API_KEY' : '7d58d8c8-4447-4432-b2ed-982cd6b1764a'  
    }
  }).then(res => res.json())
  .then(json => {
    let foopData = json.data

    var coinCheckArray = [ 'BTC', 'ETH', 'BNB', 'ADA', 'DOGE', 'XRP', 'DOT', 'LINK', 'BCH', 'LTC', 'SOL', 'XLM', 'ETC', 'EOS', 'TRX', 'XMR', 'DAI', 'NEO', 'COMP', 'DASH', 'XEM', 'HOT', 'ZEN', 'BAT', 'QTUM' ];
    for(var i= 0; i < foopData.length; i++){

      var result = coinCheckArray.includes(foopData[i]['symbol']);
      console.log('symbol===================>>>>>>>>>>',  foopData[i]['symbol'])

      console.log('result =============>>>>>>>>>>>>', result)
      if(result == true || result == 'true'){
        let insertedArray = {
          name                :  foopData[i]['name'],
          coin                :  foopData[i]['symbol'],
          slug                :  foopData[i]['slug'],
          created_date        :  new Date()
        }
        if(foopData[i]['symbol'] == 'BTC'){

          insertedArray['symbol'] = 'BTCUSDT';
        }else if(foopData[i]['symbol'] == 'ETH'){

          insertedArray['symbol'] = 'ETHBTC'
        }else if(foopData[i]['symbol'] == 'BNB'){

          insertedArray['symbol'] = 'BNBBTC'
        }else if(foopData[i]['symbol'] == 'ADA'){

          insertedArray['symbol'] = 'ADABTC'
        }else if(foopData[i]['symbol'] == 'DOGE'){

          insertedArray['symbol'] = 'DOGEBTC'
        }else if(foopData[i]['symbol'] == 'XRP'){

          insertedArray['symbol'] = 'XRPBTC'
        }else if(foopData[i]['symbol'] == 'DOT'){

          insertedArray['symbol'] = 'DOTBTC'
        }else if(foopData[i]['symbol'] == 'LINK'){

          insertedArray['symbol'] = 'LINKBTC'
        }else if(foopData[i]['symbol'] == 'BCH'){

          insertedArray['symbol'] = 'BCHBTC'
        }else if(foopData[i]['symbol'] == 'LTC'){

          insertedArray['symbol'] = 'LTCBTC'
        }else if(foopData[i]['symbol'] == 'SOL'){

          insertedArray['symbol'] = 'SOLBTC'
        }else if(foopData[i]['symbol'] == 'XLM'){

          insertedArray['symbol'] = 'XLMBTC'
        }else if(foopData[i]['symbol'] == 'ETC'){

          insertedArray['symbol'] = 'ETCBTC'
        }else if(foopData[i]['symbol'] == 'EOS'){

          insertedArray['symbol'] = 'EOSBTC'
        }else if(foopData[i]['symbol'] == 'TRX'){

          insertedArray['symbol'] = 'TRXBTC'
        }else if(foopData[i]['symbol'] == 'XMR'){

          insertedArray['symbol'] = 'XMRBTC'
        }else if(foopData[i]['symbol'] == 'DAI'){

          insertedArray['symbol'] = 'DAIBTC'
        }else if(foopData[i]['symbol'] == 'NEO'){

          insertedArray['symbol'] = 'NEOBTC'
        }else if(foopData[i]['symbol'] == 'COMP'){

          insertedArray['symbol'] = 'COMPBTC'
        }else if(foopData[i]['symbol'] == 'DASH'){

          insertedArray['symbol'] = 'DASHBTC'
        }else if(foopData[i]['symbol'] == 'XEM'){

          insertedArray['symbol'] = 'XEMBTC'
        }else if(foopData[i]['symbol'] == 'HOT'){

          insertedArray['symbol'] = 'HOTBTC'
        }else if(foopData[i]['symbol'] == 'ZEN'){

          insertedArray['symbol'] = 'ZENBTC'
        }else if(foopData[i]['symbol'] == 'BAT'){

          insertedArray['symbol'] = 'BATBTC'
        }else if(foopData[i]['symbol'] == 'QTUM'){

          insertedArray['symbol'] = 'QTUMBTC'
        }

        console.log(insertedArray)  
        let where = {symbol : foopData[i]['name']}
        db.collection('coins').updateOne(where, {$set : insertedArray}, {upsert: true}, async(err, result) => {
          if(err){

            console.log('We are Getting some DataBase Error!!')
          }else{

            console.log('Coin Inserted SuccessFully!!!')
          }
        })
      }//end if
    }//end loop
    console.log('successfully added all coins')
    // conn.close();
  
  });
});


router.get('/walletRead', async function(req, res, next){

  var io = require('socket.io-client');
  var socket = io.connect('http://18.196.35.17:3000/');

  // socket = io("http://18.196.35.17:3000/");   
  // socket.emit('buyer', '');
  // socket.on("buyer", msg => {
  //   console.log(msg)
  // })


  io.on('connection', (socket) => {
    console.log('a user connected');
  });




});


//get all coinsname  get request
// https://api.pro.changelly.com/api/2/public/currency

//get ticker
// https://api.pro.changelly.com/api/2/public/ticker

//trades
// https://api.pro.changelly.com/api/2/public/trades

// documentaion 
// https://api.pro.changelly.com/#socket-session-authentication


/////////////////////////////////////////////////////////////////
/////////////////WAQAS CODE ////////////////////////////////////
///////////////////////////////////////////////////////////////

//course
















router.post('/create/course', upload.fields([{
  name: 'video', maxCount: 1
}, {
  name: 'image', maxCount: 1
}]), async function (req, res, next) {
  console.log("hello");

  var coursedata = {
    'title': req.body.title.toString(),
    "description": req.body.description.toString(),
    "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) : ''.toString(),
    "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : ''.toString(),
    "category":req.body.category.toString().trim(),
    "category_desc":req.body.category_desc.toString(),
    "category_image":req.body.category_image.toString().trim(),
    "category_video":req.body.category_video.toString().trim(),
    "price":req.body.price.toString(),
    "courseplan":req.body.courseplan.toString(),
    "tagname":req.body.tagname.toString(),
    "lessons" : []
  };
  console.log(coursedata)
 var db = await conn;
 await db.collection('courses').insertOne(coursedata, (err, result) => {
   if(err){
     res.status(404).send(err);
   }else{
     
     res.status(200).send(coursedata);
   }
  });

});

router.delete('/remove/course/:id', async function (req, res) {
  console.log(req.params.id);

  let ObjectId =  new objectId(req.params.id);
  let db = await conn;

  db.collection('courses').find({_id: ObjectId}, async(err, response) => {
    if(err){

      console.log('error in db')
    }else{

      let result  = await response.toArray() 
      
      let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();
      let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['video']].toString();
    
      console.log('img', img_name)
      console.log('video',video_name)
      try {

        fs.unlinkSync(video_name);
        console.log('video Successfully deleted!')
    
        fs.unlinkSync(img_name);
        console.log('image Successfully deleted!')
      
      } catch (e) {

        console.log(e)
      }
      
      for(var i= 0 ; i < result[0]['lessons'].length; i++){

        let course_img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][i]['image']].toString();
        let course_video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][i]['video']].toString();
        console.log('course', course_img_name)
        console.log('course img', course_img_name)

        try {

          fs.unlinkSync(course_video_name);
          console.log('Course video Successfully deleted!')

          fs.unlinkSync(course_img_name);
          console.log('Course image Successfully deleted!')
        
        } catch (e) {

          console.log(e)
        }
      }//end loop
    }//end else
  })

  let response = await db.collection('courses').removeOne({_id:ObjectId })
  res.send(response);

  // console.log(response);

});

router.post('/updatecourse/:id', upload.fields([{ name: 'video', maxCount: 1}, {name: 'image', maxCount: 1 }]), async function (req, res, next) {

  let ID =  new objectId(req.params.id);

  let db = await conn;
  db.collection('courses').find({_id: ID}, async(err, response) => {
    if(err){

      console.log('error in db')
    }else{

      let result  = await response.toArray() 
      
      let imgName   = result[0]['lessons'][indexNumber]['image'].toString();
      let videoName = result[0]['lessons'][indexNumber]['video'].toString()

      let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][indexNumber]['image']].toString();  
      let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['lessons'][indexNumber]['video']].toString(); 
      
      try {

        if(videoName){

          fs.unlinkSync(video_name);
          console.log('video Successfully deleted!')
        }
        if(imgName){

          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        }
      
      } catch (e) {

        console.log(e)
      }
    }
          
  })


 const updateCourse  =await db.collection('courses').updateOne(
  { "_id": ID}, // Filter
  {$set: 
  {
    'title': req.body.title.toString(),
    "description": req.body.description.toString(),
    "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) : req.body.image.toString(),
    "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : req.body.video.toString(),
    'category': req.body.category.toString(),
    'courseplan':req.body.courseplan.toString(),
    "price":req.body.price.toString(),
    "tagname":req.body.tagname.toString(),
  }}, // Update
    {upsert: true} // add document with req.body._id if not exists 
  );
 
  if(updateCourse){
    var responseArray = {
    'status' : ' Course Update Successfully',
    'type'   : 200,
    'id'    : ID,
    'title' : req.body.title  
  };

  console.log(responseArray);
  res.send(responseArray);

  }
 else{

  var responseArray = {
    'status' : ' Course  Not Updated',
    'type'   : 304,
  };
  res.send(responseArray);
 }

});


router.get('/show/courses', async function (req, res) {

  let db = await conn;

  let response = await db.collection('courses').find().toArray()
  res.send(response);
 


});

router.get('/plan/show', async function (req, res) {

  let db = await conn;

  let free  = { 'courseplan' : 'free'}    
  let freedata = await db.collection('courses').find(free).toArray()
 
  let master  = { 'courseplan' : 'master'}    
  let masterdata = await db.collection('courses').find(master).toArray()
  const freePlan = [...freedata]
  //  console.log(freePlan ) 
   const masterPlan = [...masterdata]
  const coursedata ={
     status:"200",
     free: freePlan,
    master: masterPlan
  }
 res.send(coursedata);
 


});

router.get('/course/show/', async function (req, res) {

  let db = await conn;

  const data =await db.collection('courses').aggregate([
    { $lookup:
       {
         from: 'categories',
         localField: 'category',
         foreignField: 'category',
         as: 'orderdetails'
       }
     }
    ]).toArray()
  
  console.log(data);
  res.send(data);
});

router.get('/singlecourse/:id', async function (req, res) {
   
  let ID =  new objectId(req.params.id);

  let db = await conn;

  console.log(ID)

  let response = await db.collection('courses').find({_id: ID}).toArray();
  res.send({...response});

  // console.log({...response});


});

//category get

// router.get('/getAllCategories', async function (req, res) {

//   let db = await conn;

//   let lookupQuery = [

//     {
//       '$project':{
//         '_id'           : '$category',
//         'courseplan'    : '$courseplan',
//         'lesson' : {'$sum': { $size: "$lessons" }},
//       }
//     },

//   ];
//   let category = await db.collection('courses').aggregate(lookupQuery).toArray()

//   console.log(category);
//   const categorydata ={
//     status:"200",
//     category: category,
  
//  }
//  res.send(categorydata);

// });

//lesson

router.post('/create/lesson', upload.fields([{
  name: 'video', maxCount: 1
}, {
  name: 'image', maxCount: 1
}]), async function (req, res, next) {

  let id = await helperCon.generateRandonIdForLession();
   console.log(id);
  // let lessionData = {}

  let lessionData =  {
    "course_id" : id,
    'title': req.body.title.toString(),
    "description": req.body.description.toString(), 
    "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) : ''.toString(),
    "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : ''.toString(),
  
};

  let ObjectId =  new objectId(req.body.course_id);

  let whereCouse = {'_id' : ObjectId};
 var db = await conn;
 await db.collection("courses").updateOne(whereCouse, {$push: {lessons: lessionData} }, (err, result) => {
   if(err){
     console.log('error')
     res.status(404).send(err);
   }else{
     console.log('added')
    
      // const data =[...lessionData]

      // console.log('added');
     
    //  res.status(200).send(data);
   }
  });


});

//catregory

router.post('/create/category', upload.fields([{
  name: 'video', maxCount: 1
}, {
  name: 'image', maxCount: 1
}]), async function (req, res, next) {

 
 
  let category    =   (req.body.title).toUpperCase();
  // console.log(category);

  let categoryExit    = await helperCon.findCategoryExit(category)

  if(categoryExit > 0 ){

    var responseArray = {
      'status' : 'Category already exists',
      'type'   : 404,
    };
    res.send(responseArray);
  }
  else{
 
 
  var categorydata = {
    'title': req.body.title.toString().toUpperCase(),
    "description": req.body.description.toString(),
    "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) : ''.toString(),
    "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : ''.toString(),
 };

 var db = await conn;
 await db.collection('categories').insertOne(categorydata, (err, result) => {
   if(err){
     console.log('error')
     res.status(404).send(err);
   }else{
     console.log('sucess')
     var responseData = {
       type : 200,
      
       categorydata : categorydata
     }
     res.status(200).send(responseData);
   }
  });

}


});
router.post('/updatecategory/:id', upload.fields([{name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async function (req, res, next) {

  let category      =   (req.body.title).toUpperCase();
  let categoryExit  =   await helperCon.findCategoryExit(category)

  if(categoryExit > 0 ){

    let ID =  new objectId(req.params.id);
    var db = await conn;
    db.collection('categories').find({_id: ID}, async(err, response) => {
      if(err){

        console.log('error in db')
      }else{

        let result  = await response.toArray() 
       
        let imgName   = result[0]['image'].toString();
        let videoName = result[0]['video'].toString()

        let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();  
        let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['video']].toString(); 
        
        try {

          if(videoName){

            fs.unlinkSync(video_name);
            console.log('video Successfully deleted!')
          }
          if(imgName){

            fs.unlinkSync(img_name);
            console.log('image Successfully deleted!')
          }
        
        } catch (e) {

          console.log(e)
        }
      }
            
    })
    
    let updateCategory = await db.collection('categories').updateOne(
      {"_id": ID}, // Filter
      {$set: 
    {
      "description": req.body.description.toString(),
      "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) :  req.body.image.toString(),
      "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : req.body.video.toString(),
    }}, // Update
      {upsert: true} // add document with req.body._id if not exists 
    );
  
    if(updateCategory){
      var responseArray = {
        'status' : ' Category Update Successfully',
        'type'   : 200,
      };
     res.send(responseArray);
    
    } else{
    
      var responseArray = {
        'status' : ' Category  Not Update',
        'type'   : 304,
      };
      res.send(responseArray);
    
     }
  
  } else{
    let ID =  new objectId(req.params.id);

    // console.log(ID);
    var db = await conn;
    let updateCategory =await db.collection('categories').updateOne(
      { "_id": ID}, // Filter
      {$set: 
    {
      'title': req.body.title.toString().toUpperCase(),
      "description": req.body.description.toString(),
      "image": (req.files.image) ?  str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.image[0].path).trim()) :  req.body.image.toString(),
      "video": (req.files.video) ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', (req.files.video[0].path).trim()) : req.body.video.toString(),

    }}, // Update
      {upsert: true} // add document with req.body._id if not exists 
    );
    
    if(updateCategory){
      var responseArray = {
        'status' : ' Category Update Successfully',
        'type'   : 200,
      };
    res.send(responseArray);

  }else{

    var responseArray = {
      'status' : ' Category  Not Updated',
      'type'   : 304,
    };
    res.send(responseArray);

  }

}
});

router.delete('/delete/category/:id', async function (req, res) {
  let ObjectId =  new objectId(req.params.id);

  let db = await conn;
  db.collection('categories').find({_id: ObjectId}, async(err, response) => {
    if(err){

      console.log('error in db')
    }else{

      let result  = await response.toArray() 
      
      let imgName   = result[0]['image'].toString();
      let videoName = result[0]['video'].toString()

      let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();  
      let video_name = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['video']].toString(); 
      
      try {

        if(videoName){

          fs.unlinkSync(video_name);
          console.log('video Successfully deleted!')
        }
        if(imgName){

          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        }
      
      } catch (e) {

        console.log(e)
      }
    }
            
  })

  let response = await db.collection('categories').removeOne({_id:ObjectId })
  res.send(response);

  console.log(response);


});

router.get('/show/categories', async function (req, res) {

  let db = await conn;

  db.collection('categories').find({}, async(err, result) => {
    if(err){
      var responseArray = {
        'status' : 'Some Thing wrong with your DB!',
        'type'   : 404,
      };
      res.status(404).send(responseArray);
    }else{
      let count = await result.toArray()
      if( count.length == 0 || count.length == undefined){
        var responseArray = {
          'status' : 'record not Found!',
          'type'   : 400,
        };
        res.status(200).send(responseArray);

      }else{


        var responseArray = {
          data    : await result.toArray(),
          type    : 200,
        };
        res.status(200).send(responseArray);
      }
    }
  })
  // res.send(response);
});

router.get('/singlecategory/:id', async function (req, res) {
   
  let ID =  new objectId(req.params.id);

  let db = await conn;

  console.log(ID)

  let response = await db.collection('categories').find({_id: ID}).toArray();
  res.send({...response});

  // console.log({...response});


});

//tags

router.get('/show/tags', async function (req, res) {

  let db = await conn;

  let response = await db.collection('tags').find().toArray()
  res.send(response);

});

router.post('/create/tag', async function (req, res) {
  var data = {
    'tagname': req.body.tagname.toString()
  }

  var db = await conn;
  await db.collection('tags').insertOne(data, (err, result) => {
    if (err) {
      res.status(404).send(err);
    } else {

      res.status(200).send(data);
    }
  });

});

// router.get('/show/tags', async function (req, res) {

//   let db = await conn;

//   let response = await db.collection('tags').find().toArray()
//   res.send(response);

// });

router.delete('/delete/tag/:id', async function (req, res) {
  let ObjectId =  new objectId(req.params.id);
  let deleteMaany = {tag_id : req.params.id.toString()};
  let db = await conn;

  let response = await db.collection('tags').removeOne({_id:ObjectId })

  db.collection('user_tags').deleteMany(deleteMaany, async(err, result) => {

    if(err){

      res.send(await err);
    }else{

      res.send(await response);
    }
  })

});
router.get('/singletag/:id', async function (req, res) {
   
  let ID =  new objectId(req.params.id);

  let db = await conn;

  console.log(ID)

  let response = await db.collection('tags').find({_id: ID}).toArray();
  res.send({...response});

  // console.log({...response});


});

router.post('/update/tag/:id', async function (req, res, next) {

  let ID =  new objectId(req.params.id);

 
// console.log(ID);
 var db = await conn;
 const updateTag  =await db.collection('tags').updateOne(
  { "_id": ID}, // Filter
  {$set: 
{
    'tagname': req.body.tagname.toString()

}}, // Update
  {upsert: true} // add document with req.body._id if not exists 
);

if(updateTag)
{

  var responseArray = {
    'status' : ' Tag Update Successfully',
    'type'   : 200,
  };

  res.send(responseArray);
  

}
else{
var responseArray = {
  'status' : ' Tag Not Update',
  'type'   : 200,
};

res.send(responseArray);
}



});

//subscription
router.post('/create/subscription',   upload.single("file"), async function (req, res,next) {
  var data = {
    'title'   : req.body.title.toString(),
    "price"   :req.body.price.toString(),
    "description": req.body.description.toString(),
    "image"   : req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) :"",
    "type"    : req.body.type.toString() // month = 0 and year = 1
  };

 var db = await conn;
 await db.collection('subscriptions').insertOne(data, (err, result) => {
   if(err){
     res.status(404).send(err);
   }else{
     
     res.status(200).send(data);
   }
  });



});
router.put('/edit/:id',upload.single("file"), async function (req, res,next) {
  
  let ID =  new objectId(req.params.id);
  console.log(req.body.file);

  // console.log(ID);
  var db = await conn;

  db.collection('subscriptions').find({_id: ID}, async(err, response) => {
    if(err){

      console.log('error in db')
    }else{

      let result  = await response.toArray() 
      
      let imgName   = result[0]['image'].toString();

      let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();  
      
      try {

        if(imgName){

          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        }
      
      } catch (e) {

        console.log(e)
      }
    }
            
  })

  var updateSubcription =await db.collection('subscriptions').updateOne(
    { "_id": ID}, // Filter
    {$set: 
  {
    'title': req.body.title.toString(),
    "price":req.body.price.toString(),
    "description": req.body.description.toString(),
    "image": req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) : req.body.image,
    "type" : req.body.type.toString(), // 0 month and 1 year
    "image": req.file ? str_replace('/var/www/html/crypto_stock_application/public/upload/', '', ((req.file.path).trim())) : req.body.file

 }}, // Update
   {upsert: true} // add document with req.body._id if not exists 
 );
 if(updateSubcription){
  var responseArray = {
    'status' : ' Subcription Update Successfully',
    'type'   : 200,
  };

 console.log(responseArray);
 res.send(responseArray);

}
 else{

  var responseArray = {
    'status' : ' Subcription  Not Update',
    'type'   : 304,
  };
  res.send(responseArray);

 }

});

router.get('/show/subscription', async function (req, res) {

  let db = await conn;

  db.collection('subscriptions').find({}, async(err, result) => {

  
    if(err){
      var responseArray = {
        'status' : 'Some Thing wrong with your DB!',
        'type'   : 404,
      };
      res.status(404).send(responseArray);
    }else{
      let count = await result.toArray()
      if( count.length == 0 || count.length == undefined){

        var responseArray = {
          'status' : 'record not Found!',
          'type'   : 400,
        };
        res.status(200).send(responseArray);

      }else{


        var responseArray = {
          data       : await result.toArray(),
          type       : 200,
        };
        res.status(200).send(responseArray);
      }
    }
  })
});

router.delete('/delete/subscription/:id', async function (req, res) {
  
   
  let ObjectId =  new objectId(req.params.id);

  let db = await conn;

  db.collection('subscriptions').find({_id: ObjectId}, async(err, response) => {
    if(err){

      console.log('error in db')
    }else{

      let result  = await response.toArray() 
      
      let imgName   = result[0]['image'].toString();

      let img_name   = ["/var/www/html/crypto_stock_application/public/upload/" +  result[0]['image']].toString();  
      
      try {

        if(imgName){

          fs.unlinkSync(img_name);
          console.log('image Successfully deleted!')
        }
      
      } catch (e) {

        console.log(e)
      }
    }
            
  })


  let response = await db.collection('subscriptions').removeOne({_id:ObjectId })
  res.send(response);

  console.log(response);


});

router.get('/subscription/:id', async function (req, res) {
   
  let ID =  new objectId(req.params.id);

  let db = await conn;

  console.log(ID)

  let response = await db.collection('subscriptions').find({_id: ID}).toArray();
  res.send({...response});

  // console.log({...response});


});

router.post('/create/discount', async function (req, res) {
  var data = {
    'discounttitle': req.body.discounttitle.toString(),
    'discountprice': req.body.discountprice.toString(),
    'type': req.body.type.toString(),
    'randnumber': req.body.randnumber.toString(),
  }

  var db = await conn;
  await db.collection('discounts').insertOne(data, (err, result) => {
    if (err) {
      res.status(404).send(err);
    } else {


      var responseArray = {
        'status' : ' Data Add Successfully ',
        'type'   : 200,
         'data'   : data
      };

     
     
     
     
      res.status(200).send(responseArray);
    }
  });

});

router.get('/show/discounts', async function (req, res) {

  let db = await conn;

  let response = await db.collection('discounts').find().toArray()
  res.send(response);

});
router.delete('/delete/discount/:id', async function (req, res) {
  let ObjectId =  new objectId(req.params.id);
  // let deleteMaany = {tag_id : req.params.id.toString()};
  let db = await conn;

  let response = await db.collection('discounts').removeOne({_id:ObjectId })
  res.send(await response);
});

router.post('/discountcode/show', async function (req, res) {

  // if(req.body.randnumber){



    const Code = req.body.randnumber.toString();
  

    let db = await conn;

    let discoundCode  = {'randnumber' : Code}    
    let data = await db.collection('discounts').find(discoundCode).toArray()

    if(data == ""){
      const discountdata ={
        status:"There is no Data",
        type:400,
        data: "",
      
    }
    res.send(discountdata);
  }
   
    else{
      const discountdata ={
        status:"Data Get Successfully",
        type:200,
        data: data,
        
     }
   
  res.send(discountdata);

  }

  //     let response = {
  //     status : 'payload issue!!',
  //     type   : 203
  //   }


  //   res.status(203).send(response)
  // }






  
 
});



