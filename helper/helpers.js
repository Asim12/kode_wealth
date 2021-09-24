

var conn          =   require("../conn/connection");
const bcrypt      =   require('bcrypt');
const MongoClient =   require('mongodb').MongoClient;
const objectId    =   require('mongodb').ObjectID;
const nodemailer  =   require("nodemailer");
const { IoTJobsDataPlane } = require("aws-sdk");
const randomstring=   require("randomstring");
const md5         =   require('md5');
const e           =   require("cors");

module.exports = {

    
    //check already email exists 
    findEmailExists: (email) => {
        return new Promise(resolve => {
            conn.then(db => {
                let where = {'email_address' : email};
                db.collection('users').countDocuments(where, (err, result) => {
                    if (err) {
                        resolve(err)
                    } else {
                        resolve(result)
                    }
                })
            })
        })
    },

    generateEmailConfirmationCodeSendIntoEmail: (email)=> {

        return new Promise((resolve, reject) => {
            conn.then(db => {
                let generatedNumber = (Math.floor(1000 + Math.random() * 9000)).toString();
                let updateArry = {
                    'rest_password_email_code' : parseFloat(generatedNumber),
                    'code_generate_time'       : new Date()
                }

                let where = {'email_address' : email};
                db.collection('users').updateOne(where, {$set: updateArry}, (err, result) => {
                    if (err) {

                        resolve(false)
                    } else {

                        let transporter = nodemailer.createTransport({
                            service : 'gmail',
                            host    : 'smtp.gmail.com',
                            secure  : false, 
                            auth: {
                              user  : 'asim22578@gmail.com', 
                              pass  : 'Allahisone1', 
                            },
                          });
                        
                          let info =  transporter.sendMail({
                            from    : 'asim22578@gmail.com', 
                            to      :  email, 
                            subject : "Testing", 
                            html    : "<b>This is your Password Reset Confirmation Code:"+generatedNumber+"</b>", 

                        }).catch((e)=> {
                            
                            resolve(false);
                        });
                       
                        console.log('email send Successfully!!!!')
                        resolve (true);

                    }
                })
            })
        })
    },

    finduserNameExists: (userName) => {
        return new Promise(resolve => {
            conn.then(db => {
                let where = {'username' : userName};
                db.collection('users').countDocuments(where, (err, result) => {
                    if (err) {
                        resolve(err)
                    } else {
                        resolve(result)
                    }
                })
            })
        })
    },

    passwordEncryption:function(password) {

        let saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);

        return hash;
    },

    pinEncryptionAndSave:(pin,email) => {
        return new Promise(resolve => {
            conn.then(db=>{

                let saltRounds = 10;
                const saltPin = bcrypt.genSaltSync(saltRounds);
                const hashPin = bcrypt.hashSync(pin, saltPin);

                let updateArray = {
                    'orignal_pin' : pin,
                    'pin'         : hashPin
                }

                let updateRecord = {}; 
                updateRecord['email_address']  =  email;
                updateRecord['pin']            =  {$exists : false }
                updateRecord['orignal_pin']    =  {$exists : false}

                db.collection('users').updateOne(updateRecord, {$set : updateArray}, (err, result)=>{
                    if(err){
                        resolve(false)
                    }else{
                        if(result.modifiedCount > 0 ){

                            resolve (true)
                        }else{

                            resolve(false)
                        }
                    }
                } )
            });
        });
    },

    codeVarify: (email, code)=> {
        return new Promise(resolve => {
            conn.then((db) => {
                let currentTime = new Date();
                var dd = currentTime.setMinutes(currentTime.getMinutes() - 5);
                currentTime = new Date(dd);

                let match = {
                    'email_address'            : email.toString(),
                    'rest_password_email_code' : parseFloat(code),
                    'code_generate_time'       : {'$gte' : currentTime}

                }
                db.collection('users').countDocuments(match, (err, result)=> {
                    if(err){
                        resolve(false)
                    }else{
    
                        resolve(result)
                    }
                })

            })
        });
    },

    pinChange: (email_address, new_pin, old_pin )=> {
        return new Promise(resolve => {
            conn.then(db => {

                let saltRounds   = 10;
                const saltPin    = bcrypt.genSaltSync(saltRounds);
                const hashNewPin = bcrypt.hashSync(new_pin, saltPin);

                let updateRecordFound = {}; 
                updateRecordFound['email_address']  =  email_address;
                updateRecordFound['orignal_pin']    =  old_pin
                updateRecordFound['pin']            =  {$exists: true}


                let updateArray = {
                    'orignal_pin' : new_pin,
                    'pin'         : hashNewPin
                }

                db.collection('users').updateOne(updateRecordFound, {$set : updateArray}, (err, result)=>{
                    if(err){
                        resolve(false)
                    }else{
                        if(result.modifiedCount > 0 ){

                            resolve (true)
                        }else{

                            resolve(false)
                        }
                    }
                })
            });
        });
    },

    pinUpdateProcess: (email_address, new_pin )=> {
        return new Promise(resolve => {
            conn.then(db => {

                let saltRounds   = 10;
                const saltPin    = bcrypt.genSaltSync(saltRounds);
                const hashNewPin = bcrypt.hashSync(new_pin, saltPin);

                let updateRecordFound = {}; 
                updateRecordFound['email_address']  =  email_address;

                let updateArray = {
                    'orignal_pin' : new_pin,
                    'pin'         : hashNewPin
                }

                db.collection('users').updateOne(updateRecordFound, {$set : updateArray}, (err, result)=>{
                    if(err){
                        resolve(false)
                    }else{
                        if(result.modifiedCount > 0 ){

                            resolve (true)
                        }else{

                            resolve(false)
                        }
                    }
                })
            });
        });
    },

    passwordUpdateProcess:(email, new_password) => {
        return new Promise(resolve => {
            conn.then((db)=> {

                let saltRounds    =  10;
                const saltPass    =  bcrypt.genSaltSync(saltRounds);
                const hashNewPass =  bcrypt.hashSync(new_password, saltPass);

                let updateRecordFound = {}; 
                updateRecordFound['email_address']  =  email;

                let updateArray = {
                    'orignal_password' : new_password,
                    'password'         : hashNewPass
                }

                db.collection('users').updateOne(updateRecordFound, {$set : updateArray}, (err, result)=>{
                    if(err){
                        resolve(false)
                    }else{
                        if(result.modifiedCount > 0 ){

                            resolve (true)
                        }else{

                            resolve(false)
                        }
                    }
                })


            });
        });
    },

    userData: (email_address) => {
        return new Promise(resolve => {
            conn.then(db => {
                let where = {'email_address' : email_address};
                db.collection('users').find(where, async(err, result) => {
                    if (err) {
                        resolve(err)
                    } else {
                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    //login data for admin
    userDataAdmin: (email_address) => {
        return new Promise(resolve => {
            conn.then(db => {
                let where = {
                    'email_address' : email_address,
                    'user_role'     : 2
                };
                db.collection('users').find(where, async(err, result) => {
                    if (err) {
                        resolve(err)
                    } else {
                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    getUserDetails: (admin_id) => {
        return new Promise(resolve => {
            conn.then(db => {

                let whereSearch = {"_id" : new objectId(admin_id.toString())}
                db.collection('users').find(whereSearch, async(err, result) => {
                    if(err){
                        resolve(err)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    generateRandonIdForLession:()=> {
        return new Promise(resolve => {
            
            resolve(randomstring.generate());

        })
    },

    //insert user property assert 
    insertProperty: (data) => {
        return new Promise(resolve => {
            conn.then((db) => { 
                db.collection('property_details').insertOne(data, async(err, response) => {

                    if(err){
                        resolve(0)
                        
                    }else{
                        resolve(await response.insertedCount )
                    }
                })
            })
        })
    },

    //get user property asserts
    getProperty: (user_id, pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
             
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),

                        }
                    },

                    {'$skip' : page },
                    
                    {'$limit' : 10 }
                ]
                db.collection('property_details').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{

                        let resultProperty = await result.toArray()

                        resolve(resultProperty)
                    }
                })

            })
        })
    },

    //get user asserts sum
    getUserAssertsSum: (user_id)=>{
        return new Promise(resolve => {
            conn.then(async(db) => {
                let sumproperty = [
                    {
                        '$match' : {

                            user_id : user_id.toString()
                        }
                    },
                    {
                        '$group' : {
            
                            _id : null,
                     
                            'total_sold' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$eq' : ['$status' , 'sold']},
                                        'then' : '$sell_price',
                                        'else' : 0,
                                    }
                                }
                            },

                            'total_pending' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$ne' : ['$status' , 'sold']},
                                        'then' : {'$sum' : [ '$latest_value',  '$income_from_it' ]},
                                        'else' : 0,
                                    }
                                }
                            },
                     
                        }
                    },  
                    {
                        '$project' : {

                            '_id'  : null,
                            'total_amount_property' : {'$sum' : ['$total_sold' , '$total_pending'] }

                        }
                    }
                ]
                let sumMarket = [
                    {
                        '$match' : {

                            user_id : user_id.toString()
                        }
                    },
                    {
                        '$group' : {
                            _id : null,

                            'total_sold' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$eq' : ['$status' , 'sold']},
                                        'then' : '$sell_price',
                                        'else' : 0,
                                    }
                                }
                            },

                            'total_pending' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$ne' : ['$status' , 'sold']},
                                        'then' : {'$multiply' : [ '$current_market_price',  '$share_per' ]},
                                        'else' : 0,
                                    }
                                }
                            },
                        },
                    },

                    {
                        '$project' : {

                            'total_amount_market_share'  : {'$sum' : ['$total_pending',  '$total_sold']}

                        }
                    }
                ]
                let sumPrecious = [
                    {
                        '$match' : {

                            user_id : user_id.toString()
                        }
                    },


                    {
                        '$group' : {
                            _id : null,

                            'total_sold' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$eq' : ['$status' , 'sold']},
                                        'then' : '$sell_price',
                                        'else' : 0,
                                    }
                                }
                            },

                            'total_pending' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$ne' : ['$status' , 'sold']},
                                        'then' : {'$multiply' : [ '$current_market_price',  '$qty_per_unit' ]},
                                        'else' : 0,
                                    }
                                }
                            },
                        },
                    },

                    {
                        '$project' : {

                            'total_amount_precious_metal'  : {'$sum' : ['$total_pending',  '$total_sold']}

                        }
                    }                        
                ]
                let sumCrypto = [
                    {
                        '$match' : {

                            user_id : user_id.toString()
                        }
                    },
                    
                    {
                        '$group' : {
                            _id : null,

                            'total_sold' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$eq' : ['$status' , 'sold']},
                                        'then' : '$sell_price',
                                        'else' : 0,
                                    }
                                }
                            },

                            'total_pending' : {
                                '$sum' : {
                                    '$cond' : {
                                        'if' : {'$ne' : ['$status' , 'sold']},
                                        'then' : {'$multiply' : [ '$current_market_price',  '$quantity' ]},
                                        'else' : 0,
                                    }
                                }
                            },
                        },
                    },

                    {
                        '$project' : {

                            'total_amount_crypto'  : {'$sum' : ['$total_pending',  '$total_sold']}

                        }
                    }  
                ]

                let sumProperty1 = await db.collection('property_details').aggregate(sumproperty).toArray()
                let sumMarket1   = await db.collection('market_share').aggregate(sumMarket).toArray()
                let sumPrecious1 = await db.collection('precious_metal').aggregate(sumPrecious).toArray()
                let sumCrypto1   = await db.collection('crypto_asserts').aggregate(sumCrypto).toArray()
                
                let mergeArray = sumProperty1.concat(sumMarket1, sumPrecious1, sumCrypto1);
                resolve(mergeArray)
            })
        })
    },

    //edit user property assert 
    editProperty: (data, admin_id, propertyId) => {
        return new Promise(resolve => {
            conn.then((db) => { 
                let whereEditSearch = {
                    user_id : admin_id.toString(),
                    _id     : new objectId(propertyId.toString())  
                }

                db.collection('property_details').updateOne(whereEditSearch, {$set : data}, async(err, response) => {

                    if(err){
                        resolve(0)
                    }else{
                        resolve(await response.modifiedCount)
                    }
                })
            })
        })
    },


    //delete user property assert 
    deleteProperty: (admin_id, propertyId) => {
        return new Promise(resolve => {
            conn.then((db) => { 
                let deleteSerach = {
                    user_id :   admin_id.toString(), 
                    _id     :   new objectId (propertyId.toString())
                }

                db.collection('property_details').deleteOne(deleteSerach, async(err, response) => {
                    if(err){
                        
                        resolve(0)
                    }else{
                        resolve(await response.deletedCount )
                    }
                })
            })
        })
    },
    
    //insert assert
    insertpreciousMetalHelper: (data) => {
        return new Promise(resolve => {
            conn.then((db) => {
              
                db.collection('precious_metal').insertOne(data, async(err, response) => {

                    if(err){
                        resolve(0)
                        
                    }else{
                        resolve(await response.insertedCount )
                    }
                })
            })
        })
    },

    //get user property asserts
    getpreciousMetalHelper: (user_id, pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {  
                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
             
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),

                        }
                    },

                    {'$skip' : page },
                    
                    {'$limit' : 10 }
                ] 
                db.collection('precious_metal').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                       
                        resolve(0)
                    }else{

                        resolve(await result.toArray())
                    }
                })

            })
        })
    },

    //edit user property assert 
    edit_preciousMetal: (data, admin_id, precious_metal_id) => {
        return new Promise(resolve => {
            conn.then((db) => { 
                let whereEditSearch = {
                    user_id : admin_id.toString(),
                    _id     : new objectId(precious_metal_id.toString())  
                }

                db.collection('precious_metal').updateOne(whereEditSearch, {$set : data}, async(err, response) => {

                    if(err){
                        resolve(0)
                    }else{
                        resolve(await response.modifiedCount)
                    }
                })
            })
        })
    },
    
    //delete userprecious metal assert 
    deletePreciousMetals: (admin_id, precious_metal_id) => {
        return new Promise(resolve => {
            conn.then((db) => { 

                let deleteSerach = {
                    user_id :   admin_id.toString(), 
                    _id     :   new objectId (precious_metal_id.toString())
                }

                db.collection('precious_metal').deleteOne(deleteSerach, async(err, response) => {

                    if(err){
                        
                        resolve(0)
                    }else{
                        resolve(await response.deletedCount )
                    }
                })
            })
        })
    },

    //insert assert
    insertMarketSharelHelper: (data) => {
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('market_share').insertOne(data, async(err, response) => {
                    if(err){

                        resolve(0)
                    }else{

                        resolve(await response.insertedCount )
                    }
                })
            })
        })
    },
    
    //get user market share
    getMarketShareHelper: (user_id, pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),

                        }
                    },

                    {
                        '$skip' : page
                    },
                    
                    {
                        '$limit' : 10 
                    }
                ]

                db.collection('market_share').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{

                        resolve(await result.toArray())
                    }
                })

            })
        })
    },

    //delete Market Share
    deleteMarket_share: (idd) => {
        return new Promise(resolve => {
            conn.then((db) => {

                db.collection('market_share').deleteOne({_id: new objectId(idd.toString())}, async(err, response) => {
                    if(err) {

                        resolve(false)
                    }else{

                        resolve(await response.deletedCount)
                    }
                })
            })
        })
    },

    //update market_share 
    updateMarketSharelHelper: (data, idd)=> {
        return new Promise(resolve => {
            conn.then((db) => {

                db.collection('market_share').updateOne({_id : new objectId(idd.toString())}, {$set : data}, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(await result.modifiedCount)
                    }
                })
            })
        })
    },

    //insert assert
    insertCryptoAsserts: (data, user_id, coin) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let search = {
                    user_id : user_id,
                    coin    : coin
                }
                db.collection('crypto_asserts').updateOne(search, {$set: data},{upsert: true},async(err, response) => {

                    if(err){
                       
                        resolve(0)
                    }else{

                        resolve(1)
                    }
                })
            })
        })
    },

    //get crypto
    getCryptoAsserts: (user_id, pageNumber) => {
       
       
    //    console.log(pageNumber,";;;;;;;;;");
    //    console.log(user_id,"userId");
       
        return new Promise(resolve => {
            conn.then(async(db) => {

                var limitUse ;
                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 5;
                }
             
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),
                        }
                    },

                    {
                        '$skip' : page 
                    },
                    
                    {
                        '$limit' :  5
                    }
                ]

                db.collection('crypto_asserts').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{

                        let userAsserts = await result.toArray();
                        limitUse = 10 - (userAsserts.length)
                                                
                        let coinsArray = [];
                        if(userAsserts){

                            coinsArray = userAsserts.map( el => el.coin );
                        }

                        console.log('pppppppppppppppppppppp',coinsArray)
 
                        let lookUp = [
                            {
                                '$match' : {

                                    '$and' : [
                                        { symbol : {'$nin' : coinsArray}},
                                        { coin   : {'$nin' : coinsArray}}
                                    ],
                                }
                            },
                            
                            {
                              $project : {
                                _id    : '$_id',
                                coin   : '$symbol',
                                image  : '$coin_image', 
                                name   : '$name', 
                                slug   :  '$coin'
                                
                              }
                            },
                            {
                                '$skip' : page 
                            },
                            
                            {
                                '$limit' : limitUse 
                            }
                        ];
                        let response = await db.collection('coins').aggregate(lookUp).toArray()

                        // console.log(response);
                        let mergeArray = userAsserts.concat(response);
                        
                        resolve(mergeArray)
                    }
                })

            })
        })
    },

    //get crypto search
    getCryptoAssertsSearch: (user_id, Search) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),
                            coin    : { $regex: Search,  $options: 'si' },
                            symbol  : { $regex: Search,  $options: 'si' },
                            name    : { $regex: Search,  $options: 'si' },
                            slug    : { $regex: Search,  $options: 'si' }
                        }
                    }
                ]
                db.collection('crypto_asserts').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{

                        let userAsserts = await result.toArray();
                        if(userAsserts.length > 0){

                            resolve(userAsserts)
                        }else{
    
                            let lookUp = [
                                {
                                    '$match' : {

                                        '$or' : [

                                            { symbol : {$regex : Search, $options: 'si' }}, 
                                            { coin   : {$regex : Search, $options: 'si' } },
                                            
                                            { name   : {$regex : Search, $options: 'si' }},
                                            { slug   : {$regex : Search, $options: 'si'  }},
                                        ],
                                    }
                                },
                                
                                {
                                    $project : {
                                        _id    : '$_id',
                                        coin   : '$symbol',
                                        image  : '$coin_image', 
                                        name   : '$name', 
                                        slug   :  '$coin'
                                        
                                    }
                                }
                            ];
                            let response = await db.collection('coins').aggregate(lookUp).toArray()

                            resolve(response)
                        }//end else
                    }
                })

            })
        })
    },

    //get crypto by User Id
    getCryptoAssertsByUserId: (user_id, pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {

                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
             
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),

                        }
                    },

                    {'$skip' : page },
                    
                    {'$limit' : 10 }
                ]


                db.collection('crypto_asserts').aggregate(lookUpAggregate, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{
                        let userAsserts = await result.toArray();
                        resolve(userAsserts)
                    }
                })

            })
        })
    },

    //delete crypto asserts 
    deleteCrypto_assert: (idd) => {
        return new Promise(resolve => {
            conn.then((db) => {

                db.collection('').deleteOne({_id : new objectId(idd.toString())}, async(err, response) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(await response.deletedCount)
                    }
                })

            })
        })
    },

    //CRUD user tag
    insertOrDeleteUserTag: (user_id, tag_name, tag_id)=>{
        return new Promise(resolve => {
            conn.then((db) => {
                let upsertedWhere = {
                    user_id  : user_id.toString(),
                    tag_name : tag_name,
                    tag_id   : tag_id.toString()
                }

                console.log('tag helper')
                console.log(upsertedWhere)

                db.collection('user_tags').countDocuments(upsertedWhere, async(err, result)=> {
                    if(err){
                        
                        resolve(0)
                    }else{

                        console.log('count', await result)
                        let count = await result;
                        // console.log('count', await result.length)

                        if(count == 0 || count == undefined ){

                            db.collection('user_tags').updateOne(upsertedWhere, {$set: upsertedWhere}, {upsert : true}, async(err, result)=> {

                                if(err){
            
                                    resolve(0)
                                }else{
            
                                    db.collection('user_tags').find(upsertedWhere, async(err, result) => {

                                        if(err){
                                            resolve(false)
                                        }else{

                                            resolve(await result.toArray())
                                        }
                                    })
                                }
                            })
                            
                        }else{


                            db.collection('user_tags').deleteOne(upsertedWhere, async(err, result)=> {

                                if(err){
            
                                    resolve(0)
                                }else{
            
                                    resolve(1)
                                }
                            })





                        }
                    }
                })

            })
        })
    },
    //get crypto
    getUserTag: (user_id) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let getWhere = [
                    {
                        '$match' : {

                            user_id : user_id.toString()
                        }
                    },
                    {
                        '$project' : {
                            _id       :  '$_id',
                            tag_name  :  '$tag_name',
                            user_id   :  '$user_id',
                            tag_id    :  '$tag_id'
                        }
                    }
                ]
             
            
                db.collection('user_tags').aggregate(getWhere, async(err, result) =>{
                    if(err){
                        
                        resolve(0)
                    }else{

                        let userTag = await result.toArray();
                        let tagArray = [];
                        if(userTag){

                            tagArray = userTag.map( el => new objectId(el.tag_id));
                        }

                        console.log(tagArray)
                        let lookUp = [
        
                            {
                                '$match' : {
                                    _id : {'$nin' : tagArray}
                                }
                            },
                            
                            {
                                $project : {
                                tag_name : '$tagname',
                                }
                            },
                        ];
                        let response = await db.collection('tags').aggregate(lookUp).toArray()

                        // delete userTag.tag_id;
                        let mergeArray = userTag.concat(response);
                        resolve(mergeArray)
                    }
                })

            })
        })
    },

    //coin symbol inserted
    coin_symbol_inserted:(symbol, coin_img) => {

        return new Promise(resolve => {
            conn.then((db) => {

                let whereUpdate = {symbol : symbol.toString()}

                db.collection('coins').updateMany(whereUpdate, {$set: {coin_image: coin_img }}, async(err, result)=>{
                    if(err){

                        resolve(0)
                    }else{
                        resolve(await result.modifiedCount)
                    }
                })
            })
        })
    },

    //lession deleted
    deleteLessions :(idd, course_id) => {
        return new Promise(resolve => {
            conn.then((db) =>{
                db.collection('courses').updateOne({_id: new objectId(idd.toString())}, {$pull: {"lessons" : {"course_id" : course_id} }}, async(err, response) => {
                    if(err){

                        resolve(0)
                    }else{

                        resolve(await response.modifiedCount)
                    }
                })
                
            })
        })
    },

    //edit lesson
    editLessions: (newData ,idd, indexNumber)=> {
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('courses').updateOne({_id: new objectId(idd.toString())}, {'$set' : {["lessons." + indexNumber] : newData}},async(err, result)=> { 
                    if(err){
                       
                        resolve(0)
                    }else{

                        resolve(await result.modifiedCount)
                    }
                })
            })
        })
    },

    //get all payment details 
    getPaymentDetails:()=>{
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('payment_details').find({},async(err, result) => {
                    if(err){

                        resolve(0)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    //get all users acounts
    getAllUsersAccounts:() => {
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('users').find({}, async(err, result) => {
                    if(err){

                        resolve(0)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    //save users subscriptions against user id
    getAndAddCourseDetails: (admin_id, course_id, status,course_amount) => {
        return new Promise(resolve => {
            conn.then((db) => {
                if(course_id == '0' || course_id == 0 || course_id == 1 || course_id == '1'){

                    let buy_date = new Date();
                    let expiry_date = ''
                    if(course_id == '0' || course_id == 0 ){  // 0 mean month 1 mean year
                       
                        expiry_date = new Date(buy_date.setMonth(buy_date.getMonth() + 1)) 
                    }else{

                        expiry_date = new Date(buy_date.setMonth(buy_date.getMonth() + 12))
                    }
                    let data = {
                        user_id         : admin_id.toString(),
                        course_id       : course_id.toString(),
                        status          : status,
                        course_amount   : course_amount,
                        pkg_buy_date    : new Date(),
                        pkg_expiry_date : expiry_date  
                    }

                    let user_id = {user_id :  admin_id.toString()} 

                    db.collection('users_subscriptions_details').updateOne(user_id , {$set: data},{upsert: true}, async(err, result) => {
                        if(err){

                            resolve(false)
                        }else{

                            resolve(await result.insertedCount)
                        }
                    })

                }else{

                    db.collection('courses').find({_id: objectId(course_id.toString())}, async(err, result) => {
                        if(err){

                            resolve(false)
                        }else{
                           
                            let dataArray = await result.toArray();

                            let data = {
                                title : dataArray[0].title,
                                description         :   dataArray[0].description,
                                video               :   dataArray[0].video,
                                image               :   dataArray[0].image,
                                category            :   dataArray[0].category,
                                category_desc       :   dataArray[0].category_desc,
                                category_image      :   dataArray[0].category_image,
                                category_video      :   dataArray[0].category_video,
                                courseplan          :   dataArray[0].courseplan,
                                tagname             :   dataArray[0].tagname,
                                lessons             :   dataArray[0].lessons,
                                user_id             :   admin_id,
                                status              :   status,
                                course_id           :   course_id,
                                course_amount       :   course_amount

                            }
                            db.collection('users_subscriptions_details').insertOne(data, async(err, result) => {
                                if(err){

                                    resolve(false)
                                }else{

                                    resolve(true)
                                }
                            })

                        }
                    })
                }
            })
        })
    },

    //get users subscription 
    getUserSubscriptionUsingId:(user_id)=>{
        return new Promise(resolve => {
            conn.then((db) => {
                let fetchData = {
                    user_id : user_id.toString(),
                    pkg_buy_date : {$exists: false},
                    pkg_expiry_date : {$exists: false},

                
                }

                db.collection('users_subscriptions_details').find(fetchData, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(await result.toArray())
                    }
                })

            })
        })
    },


    //get month/year users subscription 
    getSubscriptionUsingId:(user_id)=>{
        return new Promise(resolve => {
            conn.then((db) => {
                let fetchData = {
                    user_id : user_id.toString(),
                    pkg_buy_date : {$exists: true},
                    pkg_expiry_date : {$exists: true},
                }

                db.collection('users_subscriptions_details').find(fetchData, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(await result.toArray())
                    }
                })

            })
        })
    },

    /////////////////////////////////////////////////// Start Liability ////////////////////////////////////

    //adding
    addingLiability : (data) => {
        return new Promise(resolve => {
            conn.then((db) => {
                console.log(data)
                db.collection('liabilities').updateOne(data, {$set : data}, {upsert: true}, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(1)
                    }
                })
            })
        })
    },

   //get
    getLiability : (user_id, pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {
                
                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
             
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id : user_id.toString(),

                        }
                    },

                    {'$skip' : page },
                    
                    {'$limit' : 10 }
                ]
                db.collection('liabilities').aggregate(lookUpAggregate, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{
                        
                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    //delete
    deleteLiability : (name) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let deleteByName = {name :  name }
                db.collection('liabilities').deleteOne(deleteByName, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{
                        
                        resolve(await result.deletedCount)
                    }
                })
            })
        })
    },
    
    //update
    updateLiability : (newData, name) => {
        return new Promise(resolve => {
            conn.then((db) => {
                let updateByName = {name : name }
                db.collection('liabilities').updateOne(updateByName, {$set : newData},async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{
                        
                        resolve(await result.modifiedCount)
                    }
                })
            })
        })
    },

    //get subscription status paid or not
    getUserSubDetails: (user_id, category, courseplan, pageNumber) => {

        return new Promise(resolve => {
            conn.then((db) => {

                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 5;
                }
                let lookUpAggregate = [
                    {
                        '$match' : {
                            user_id    :   user_id,
                            category   :   category,
                            courseplan :   courseplan,
                        }
                    },

                    {'$skip' : page },
                    
                    {'$limit' : 5 }
                ]

                db.collection('users_subscriptions_details').aggregate(lookUpAggregate, async(err, response) => {
                    if(err){
                        resolve(false)
                    }else{
                        let result = await response.toArray()

                        courseId = result.map( el => objectId(el.course_id));

                        let limitUse = 10 - result.length;
                        let search = [
                            {
                                '$match' : {
                                    _id    :   {'$nin' : courseId},
                                    category   :   category,
                                    courseplan :   courseplan,   
                                }
                            },
        
                            {'$skip' : page },
                            
                            {'$limit' : limitUse }
                        ]
                        db.collection('courses').aggregate(search, async(err, res) => {
                            if(err){
                                resolve(false)
                            }else{
                                let returnArray = await res.toArray()

                                let merge_array = result.concat(returnArray)

                                resolve(merge_array)
                            }
                        })
                    }

                })

            })
        })
    },
    /////////////////////////////////////////////////// End Liability ////////////////////////////////////


    //get news
    getNewsDetails: (user_id = null, pageNumber, tag_name = null) =>{
        return new Promise(resolve => {
            conn.then(async(db) => {
                let page = 1;
                
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 100;
                }

                let tagArray = [];
                if(tag_name){  
                    
                    let lookup = [
                        {
                            '$match': {

                                'tag_name' :  tag_name
                            }
                        },
                        {
                            '$group' : {
                                
                                '_id'  : {
                                    '_id'   : '$_id',
                                    'published_on' : '$published_on',
                                    'tag_name'     :  '$tag_name'
                                },
                                'new_title'     : {'$first' : '$new_title'},
                                'published_on'  : {'$first' : '$published_on'},
                                'imageurl'      : {'$first' : '$imageurl'},
                                'url'           : {'$first' : '$url'},
                                'source'        : {'$first' : '$source'},
                                'body'          : {'$first' : '$body'},
                                'inserted_date' : {'$first' : '$inserted_date'}
                            }
                        },
                        {

                            '$skip' : page
                        },
                        {

                            '$limit' : 10
                        },
                        {
                            '$sort'  : {'published_on' : 1}
                        }
                    ];
                
                    let result = await db.collection('news').aggregate(lookup).toArray()
                    resolve(result)
                        
                }else{

                    db.collection('user_tags').find({user_id : user_id}, async(err, result) => {

                        if(err){

                            resolve(false)
                        }else{
                            let tag_name = await result.toArray()

                            if(tag_name.length === 0 || tag_name.length === undefined  || tag_name === ''){

                                let lookup = [
                                    {
                                        '$group' : {
                                            '_id'  : {
                                                '_id'   : '$_id',
                                                'published_on' : '$published_on',
                                                'tag_name'     :  '$tag_name'
                                            },
                                            'new_title'     : {'$first' : '$new_title'},
                                            'published_on'  : {'$first' : '$published_on'},
                                            'imageurl'      : {'$first' : '$imageurl'},
                                            'url'           : {'$first' : '$url'},
                                            'source'        : {'$first' : '$source'},
                                            'body'          : {'$first' : '$body'},
                                            'inserted_date' : {'$first' : '$inserted_date'}
                                        }
                                    },
                                    {

                                        '$skip' : page
                                    },
                                    {

                                        '$limit' : 10
                                    },
                                    {
                                        '$sort'  : {'published_on' : 1}
                                    }
                                ];

                                let data = await db.collection('news').aggregate(lookup).toArray() //, async(err, results) => {

                                resolve(data)
              
                            }else{
                        
                                tagArray =  tag_name.map(el =>el.tag_name)

                                let lookup = [
                                    {
                                        '$match' : {
                                            'tag_name' : { '$in' : tagArray}
                                        }
                                    },
                                    {
                                        '$group' : {
                                            '_id'  : {
                                                '_id'   : '$_id',
                                                'published_on' : '$published_on',
                                                'tag_name'     :  '$tag_name'
                                            },
                                            'new_title'     : {'$first' : '$new_title'},
                                            'published_on'  : {'$first' : '$published_on'},
                                            'imageurl'      : {'$first' : '$imageurl'},
                                            'url'           : {'$first' : '$url'},
                                            'source'        : {'$first' : '$source'},
                                            'body'          : {'$first' : '$body'},
                                            'inserted_date' : {'$first' : '$inserted_date'}
                                        }
                                    },
                                    {

                                        '$skip' : page
                                    },
                                    {

                                        '$limit' : 10
                                    },
                                    {
                                        '$sort'  : {'published_on' : 1}
                                    }
                                ];

                                let esponse = await db.collection('news').aggregate(lookup).toArray()                                   
                                resolve(esponse)
                                    
                            }//end else
                        }//end else
                    })
                }//end else
            })
        })
    },

    //user asserts sold    
    makeItSold : (sell_price, idd, type) => {
        return new Promise(resolve => {
            conn.then((db) => {

                let collectionName = '' ; 
                if(type == 1 || type == '1'){

                    collectionName  = 'crypto_asserts';
                }else if(type == 2 || type == '2'){
                    
                    collectionName  = 'market_share';
                }else if(type == 3 || type == '3'){
                    
                    collectionName  = 'property_details';
                }else if(type == 4 || type == '4'){
                    
                    collectionName  = 'precious_metal';
                }

                let updateArray = {
                    sell_price  : sell_price,
                    sold_date   : new Date(),
                    status      : 'sold'
                }
                db.collection(collectionName).updateOne({_id : new objectId(idd.toString())}, {$set: updateArray} ,async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{

                        resolve(1)
                    }
                })
            })
        })
    },

    //get precious matel prices 
    getPreciousMatelPrices: () => {
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('market_prices_precious_metal').find({}, async(err, result) => {

                    if(err){

                        resolve(false)
                    }else{
                        let data = await result.toArray()
                        var popdata = data[0].rates
                        delete popdata.Currencies;
                        resolve(data)
                    }
                })
            })
        })
    },
    getPreciousAllMatelPrices: () => {
        return new Promise(resolve => {
            conn.then((db) => {
                db.collection('market_prices_precious_metal').find({}, async(err, result) => {

                    if(err){

                        resolve(false)
                    }else{
                        let data = await result.toArray()
                        var popdata = data[0].rates.Currencies
                        // console.log(popdata);
                        // delete popdata.Currencies;
                        // popdata.Currencies;
                        const arr = [];
                        arr.push(popdata)
                        
                        resolve(arr)
                    }
                })
            })
        })
    },

    //get coin symbol fir market pricess update
    getSymbols: () => {
        return new Promise(resolve => {
            conn.then((db) => {
                let lookup = [
                    {
                        '$group' : {
                            _id : '$symbol'
                        }
                    }
                ]

                db.collection('coins').aggregate(lookup, async(err, result) => {
                    if(err){
                        resolve(false)
                    }else{
                        
                        resolve(await result.toArray())
                    }
                })
            })
        })
    },

    //get market stack symbol
    getmarketShareSymbols: (pageNumber) => {
        return new Promise(resolve => {
            conn.then((db) => {

                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 100;
                }
                let lookUpAggregate = [
                    {'$skip' : page },
                    
                    {'$limit' : 100 }
                ]
                db.collection('market_stack_companies_name').aggregate(lookUpAggregate, async(err, result) => {
                    if (err){
                        resolve(false)
                    }else{ 
                        resolve(await result.toArray())
                    }
                })

            })
        })
    },

    getBasicAuthCredentials : () => {
        return new Promise(resolve => {

            let username = md5('codeWealth');
            let password = md5('asim92578@gmail.com');

            let returnArray = {
                username   : username,
                password   : password
            }

            resolve(returnArray)
        })
    },

    //get market stack exchange data 
    getMarketStack: (pageNumber, symbol= null)=> {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let page = 1;
                if(pageNumber !=0){
                    page = (pageNumber - 1) * 10;
                }
                let aggregateMatch;
                if(symbol){
                    var lookGetName = [
                        {
                            '$match' :  {                    
                                // name:  { $regex:symbol },
                                '$or' : [
                                    { symbol : {$regex : symbol, $options: 'si' }}, 
                                    { name   : {$regex : symbol, $options: 'si' }}, 
                                ]
                            }
                        },
                        {
                            '$project' : {
                                '_id'     : 1,
                                'symbol'  : '$symbol'
                            }
                        }
                    ]                    
                    let symbolsData = await db.collection('market_stack_companies_name').aggregate(lookGetName).toArray()

                    symbolsData = symbolsData.map(el => el.symbol)

                    aggregateMatch = [
                        {
                            '$match' : {
                                // symbol : symbol 
                                symbol :{'$in' :  symbolsData}
                            }
                        },
                   
                        {
                            '$group' : {
                                '_id'           :   '$symbol',
                                adj_close       :   {'$first' : '$adj_close'},
                                adj_high        :   {'$first' : '$adj_high'},
                                adj_low         :   {'$first' : '$adj_low'},
                                adj_open        :   {'$first' : '$adj_open'},
                                adj_volume      :   {'$first' : '$adj_volume'},
                                close           :   {'$first' : '$close'},
                                created_date    :   {'$first' : '$created_date'},
                                date            :   {'$first' : '$date'},
                                exchange        :   {'$first' : '$exchange'},
                                high            :   {'$first' : '$high'},
                                low             :   {'$first' : '$low'},
                                open            :   {'$first' : '$open'},
                                split_factor    :   {'$first' : '$split_factor'},
                                volume          :   {'$first' : '$volume'},
                            }
                        },
    
                        {
                            "$lookup": {
                              "from": "market_stack_companies_name",
                              "let": {
                                "symbol":  "$_id"
                              },
                              "pipeline": [
                                {
                                  "$match": {
    
                                    "$expr": {
                                      "$eq": [
                                        "$symbol",
                                        "$$symbol"
                                      ]
                                    },
                                   
                                  },
                                },
                              ],
                              "as": "new_data"
                            }
                        },
    
                        {
                            '$sort' : { 'new_data.inserted_date' : 1, 'volume' : -1 }
                        },
                        {'$skip' : page },
                    
                        {'$limit' : 10 }
                    ]

                }else{

                    aggregateMatch = [
                        {
                            '$group' : {
                                '_id'           :   '$symbol',
                                adj_close       :   {'$first' : '$adj_close'},
                                adj_high        :   {'$first' : '$adj_high'},
                                adj_low         :   {'$first' : '$adj_low'},
                                adj_open        :   {'$first' : '$adj_open'},
                                adj_volume      :   {'$first' : '$adj_volume'},
                                close           :   {'$first' : '$close'},
                                created_date    :   {'$first' : '$created_date'},
                                date            :   {'$first' : '$date'},
                                exchange        :   {'$first' : '$exchange'},
                                high            :   {'$first' : '$high'},
                                low             :   {'$first' : '$low'},
                                open            :   {'$first' : '$open'},
                                split_factor    :   {'$first' : '$split_factor'},
                                volume          :   {'$first' : '$volume'},
                            }
                        },
                        // {
                        //     '$addFields' : {
                        //         'sortingFiled' : {
                        //             '$sum' : {
                        //                 '$cond' : { 
                        //                     'if' : { '$in' : ['$_id', arrayMatch ] }, 
                        //                     'then' : 1,
                        //                     'else' : null
                        //                 }
                        //             }
                        //         },
                        //     }
                        // },

                        {
                            "$lookup": {
                              "from": "market_stack_companies_name",
                              "let": {
                                "symbol":  "$_id"
                              },
                              "pipeline": [
                                    {
                                        "$match": {
        
                                            "$expr": {
                                            "$eq": [
                                                "$symbol",
                                                "$$symbol"
                                            ]
                                            },
                                    
                                        },
                                    },
                                ],
                              "as": "new_data"
                            }
                        },
    
                        {
                            '$sort' : {  'new_data.inserted_date' : 1,  'volume' : -1 }
                        },
                        {'$skip' : page },
                    
                        {'$limit' : 10 }
                    ]
                }

                db.collection('market_stack_details').aggregate(aggregateMatch, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else
                    
                    resolve(await result.toArray())
                })
            })
        })
    },

    //sleep function
    sleep:function(millis) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () { resolve(); }, millis);
        });
    },

    uploadFileImage : (image , user_id ) => {
        return new Promise(resolve => {
            conn.then((db) => {

                db.collection('users').updateOne({_id : new objectId(user_id.toString())}, {$set: {image : image}}, async(err, result) => {
                    if(err){

                        resolve(false)
                    }else{
                        
                        resolve(await result.modifiedCount)
                    }
                })

            })
        })
    },

    //get chart data
    getChartData : (coin_name, first, second) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let currentTime = new Date();
                let endTime = new Date();
                let LookUp = [];
                if(second === 'H'){

                    var olderDate = new Date(currentTime);
                    olderDate.setHours(olderDate.getHours() - first)
                    
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                _id     :   1, 
                                high    :   '$high',
                                time    :   '$time',
                                eventTime : '$eventTime',
                                symbol  :   '$symbol',
                                open    :  '$open',
                                low     :  '$low',
                                close   :  '$close',
                                volume  :  '$volume',
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'D'){

                    var olderDate = new Date(currentTime);
                    olderDate.setDate(olderDate.getDate() -first);

                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                _id     :   1, 
                                high    :   '$high',
                                time    :   '$time',
                                eventTime : '$eventTime',
                                symbol  :   '$symbol',
                                open    :  '$open',
                                low     :  '$low',
                                close   :  '$close',
                                volume  :  '$volume',
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'M'){

                    var olderDate=new Date(currentTime);
                    olderDate.setMonth(olderDate.getMonth() -first);

                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                _id     :   1, 
                                high    :   '$high',
                                time    :   '$time',
                                eventTime : '$eventTime',
                                symbol  :   '$symbol',
                                open    :  '$open',
                                low     :  '$low',
                                close   :  '$close',
                                volume  :  '$volume',
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'Y'){

                    var olderDate= new Date(currentTime);
                    olderDate.setFullYear(olderDate.getFullYear() -first);

                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                _id     :   1, 
                                high    :   '$high',
                                time    :   '$time',
                                eventTime : '$eventTime',
                                symbol  :   '$symbol',
                                open    :  '$open',
                                low     :  '$low',
                                close   :  '$close',
                                volume  :  '$volume',
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else{
                    
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                            }
                        },
                        {
                            '$project' : {
                                _id     :   1, 
                                high    :   '$high',
                                time    :   '$time',
                                eventTime : '$eventTime',
                                symbol  :   '$symbol',
                                open    :  '$open',
                                low     :  '$low',
                                close   :  '$close',
                                volume  :  '$volume',
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }

                db.collection('market_chart').aggregate(LookUp, async(err, result) => {
                    if(err){
                        resolve(false)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },
    //.............waqas...............//
  
    getmarketPricesPreciousMetal : (metal_name, first, second) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let currentTime = new Date();

                let endTime = new Date();
                endTime =  endTime.getTime()

                let LookUp = [];

                if(second === 'H'){

                    var olderDate   = new Date(currentTime);
                    olderDate.setHours(olderDate.getHours() - first)
                    olderDate =  olderDate.getTime()


                    console.log('oooooooooooooooooooooo>>>>>>>>>>>>>>>>>> : ', olderDate)
                    LookUp = [
                        {
                            '$match' : {
                                // symbol  : metal_name,
                                "timestamp"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        // {
                        //     '$project' : {
                               
                        //         "symbol"    :   '$symbol',
                              
                        //     }
                        // },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'D'){

                    var olderDate = new Date(currentTime);
                    olderDate.setDate(olderDate.getDate() -first);
                    
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : metal_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                "symbol"    :   '$symbol',
                                
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'M'){

                    var olderDate=new Date(currentTime);
                    olderDate.setMonth(olderDate.getMonth() -first);

                    LookUp = [
                        {
                            '$match' : {
                                symbol  : metal_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {

                                "symbol"    :   '$symbol',
                                
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'Y'){
                    var olderDate= new Date(currentTime);
                    olderDate.setFullYear(olderDate.getFullYear() -first);


                    LookUp = [
                        {
                            '$match' : {
                                symbol  : metal_name,
                                "time"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                "symbol"    :   '$symbol',
                               
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else{
                    
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : metal_name,
                            }
                        },
                        {
                            '$project' : {
                                "symbol"    :   '$symbol',
                                
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }
                db.collection('market_prices_precious_metal').aggregate(LookUp, async(err, result) => {
                    if(err){
                        resolve(false)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },
   
   
   
   
    getChartMarketData : (coin_name, first, second) => {
        
        return new Promise(resolve => {
            conn.then(async(db) => {
                let currentTime = new Date();
                let endTime = new Date();

                endTime = endTime.toISOString();


                let LookUp = [];
                if(second === 'H'){
    
                    let olderDate   = new Date(currentTime.setHours(currentTime.getHours() - 24))
                    olderDate = olderDate.toISOString();
                   
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "date"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                '_id'           :   1, 
                                "date"          :   "$date", 
                                "symbol"        :   "$symbol",
                                "adj_close"     :   "$adj_close",
                                "adj_high"      :   "$adj_high",
                                "adj_low"       :   "$adj_low" ,
                                "adj_open"      :   "$adj_open",
                                "adj_volume"    :   "$adj_volume",
                                "close"         :   "$close"   ,
                                "created_date"  :   "$created_date", 
                                "exchange"      :   "$exchange" ,
                                "high"          :   "$high" ,
                                "low"           :   "$low",
                                "open"          :   "$open", 
                                "split_factor"  :   "$split_factor",
                                "volume"        :   "$volume"  
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'D'){

                    var olderDate=new Date(currentTime);
                    olderDate.setDate(olderDate.getDate() -first);
                    olderDate = olderDate.toISOString();

                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "date"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                '_id'           :   1, 
                                "date"          :   "$date", 
                                "symbol"        :   "$symbol",
                                "adj_close"     :   "$adj_close",
                                "adj_high"      :   "$adj_high",
                                "adj_low"       :   "$adj_low" ,
                                "adj_open"      :   "$adj_open",
                                "adj_volume"    :   "$adj_volume",
                                "close"         :   "$close"   ,
                                "created_date"  :   "$created_date", 
                                "exchange"      :   "$exchange" ,
                                "high"          :   "$high" ,
                                "low"           :   "$low",
                                "open"          :   "$open", 
                                "split_factor"  :   "$split_factor",
                                "volume"        :   "$volume"  
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'M'){

                    var olderDate=new Date(currentTime);
                    olderDate.setMonth(olderDate.getMonth() -first);
                    olderDate = olderDate.toISOString();
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "date"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                '_id'           :   1, 
                                "date"          :   "$date", 
                                "symbol"        :   "$symbol",
                                "adj_close"     :   "$adj_close",
                                "adj_high"      :   "$adj_high",
                                "adj_low"       :   "$adj_low" ,
                                "adj_open"      :   "$adj_open",
                                "adj_volume"    :   "$adj_volume",
                                "close"         :   "$close"   ,
                                "created_date"  :   "$created_date", 
                                "exchange"      :   "$exchange" ,
                                "high"          :   "$high" ,
                                "low"           :   "$low",
                                "open"          :   "$open", 
                                "split_factor"  :   "$split_factor",
                                "volume"        :   "$volume"  
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else if(second === 'Y'){

                    var olderDate= new Date(currentTime);
                    olderDate.setFullYear(olderDate.getFullYear() -first);
                    olderDate = olderDate.toISOString();
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                                "date"    : { "$gte" : olderDate ,  "$lte" : endTime}
                            }
                        },
                        {
                            '$project' : {
                                '_id'           :   1, 
                                "date"          :   "$date", 
                                "symbol"        :   "$symbol",
                                "adj_close"     :   "$adj_close",
                                "adj_high"      :   "$adj_high",
                                "adj_low"       :   "$adj_low" ,
                                "adj_open"      :   "$adj_open",
                                "adj_volume"    :   "$adj_volume",
                                "close"         :   "$close"   ,
                                "created_date"  :   "$created_date", 
                                "exchange"      :   "$exchange" ,
                                "high"          :   "$high" ,
                                "low"           :   "$low",
                                "open"          :   "$open", 
                                "split_factor"  :   "$split_factor",
                                "volume"        :   "$volume"  
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }else{
                    
                    LookUp = [
                        {
                            '$match' : {
                                symbol  : coin_name,
                            }
                        },
                        {
                            '$project' : {
                                '_id'           :   1, 
                                "date"          :   "$date", 
                                "symbol"        :   "$symbol",
                                "adj_close"     :   "$adj_close",
                                "adj_high"      :   "$adj_high",
                                "adj_low"       :   "$adj_low" ,
                                "adj_open"      :   "$adj_open",
                                "adj_volume"    :   "$adj_volume",
                                "close"         :   "$close"   ,
                                "created_date"  :   "$created_date", 
                                "exchange"      :   "$exchange" ,
                                "high"          :   "$high" ,
                                "low"           :   "$low",
                                "open"          :   "$open", 
                                "split_factor"  :   "$split_factor",
                                "volume"        :   "$volume"  
                            }
                        },
                        {
                            '$sort' : {time : -1}
                        }
                    ]
                }

                db.collection('market_stack_details').aggregate(LookUp, async(err, result) => {
                    if(err){
                        resolve(false)
                    }else{

                        resolve(await result.toArray())
                    }
                })
            })
        })
    },
  
  
    findCategoryExit: (category) => {
        // console.log(category);
        return new Promise(resolve => {
            conn.then(db => {
                let where = {'title' : category};
                db.collection('categories').countDocuments(where, async(err, result) => {
                    if (err) {
                        resolve(err)
                    } else {
                        resolve(await result)
                    }
                })
            })
        })
    },
};