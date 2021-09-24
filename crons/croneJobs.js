
var conn = require("../conn/connection");
const CoinMarketCap = require('node-coinmarketcap');
var helperCon = require("../helper/helpers");
const fetch = require('node-fetch');
const { then } = require("../conn/connection");
const coinmarketcap = new CoinMarketCap();

const Binance = require('node-binance-api');
const binance = new Binance().options({});
const dateFormat = require("dateformat");

module.exports = {

    //stop the crone
    price: () => {
        conn.then(async (db) => {
            // miniTicker
            let symbolsArray = await helperCon.getSymbols()
            var coins = symbolsArray.map(el => el._id);

            for (let i = 0; i < coins.length; i++) {

                binance.prices(coins[i], (error, ticker) => {
                    ticker = Object.entries(ticker);

                    ticker.forEach(([key, value]) => {

                        var result = coins.includes(key);

                        if (result == true || result == 'true') {
                            let insertedArray = {
                                symbol: key,
                                price: value,
                                created_date: new Date()
                            }
                            console.log(insertedArray)

                            let whereCoin = { symbol: key }
                            console.log('where ================>>>>>>>>>.', whereCoin)

                            db.collection('market_prices').updateOne(whereCoin, { $set: insertedArray }, { upsert: true }, (err, result) => {
                                if (err) {

                                    console.log(err)
                                } else {
                                    // console.log('upserted count: ',result.upsertedCount)
                                    // console.log('modified count: ',result. modifiedCount)
                                }
                            })
                        }//end if

                    });

                });
            }
        }).catch((err) => {
            console.log(err);
        })
    },//End of price

    //get last 24H change
    last24HoursChange: () => {
        conn.then((db) => {
            binance.prevDay(false, (error, prevDay) => {
                for (let obj of prevDay) {
                    let symbol = obj.symbol;

                    let insertedArray = {
                        symbol: symbol,
                        volume: obj.volume,
                        change: obj.priceChangePercent
                    }
                    console.log(insertedArray)
                    let match = { symbol: symbol }

                    db.collection('preDayChange').updateOne(match, { $set: insertedArray }, { upsert: true }, async (err, result) => {
                        if (err) {
                            console.log('error')
                        } else {

                            console.log('inserted count: ', await result.upsertedCount)
                            console.log('modified count: ', await result.modifiedCount)
                        }
                    })

                    //   console.info(symbol+" volume:"+obj.volume+" change: "+obj.priceChangePercent+"%");
                }
            });
        })
    },

    coinMarketCapPricesCrone: () => {
        conn.then((db) => {

            fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
                method: 'GET',
                headers: {
                    'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
                    'cache-control': 'no-cache',
                    Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
                    'Content-Type': 'application/json',
                    'X-CMC_PRO_API_KEY': '4ebe5ba4-8e71-43e1-89a4-e386d9b3866f'
                }
            }).then(res => res.json()).then(json => {

                let foopData = json.data
                for (var i = 0; i < foopData.length; i++) {

                    let insertedArray = {
                        name: foopData[i]['name'],
                        symbol: foopData[i]['symbol'],
                        slug: foopData[i]['slug'],
                        price: foopData[i]['quote']['USD']['price'],
                        volume_24h: foopData[i]['quote']['USD']['volume_24h'],
                        percent_change_1h: foopData[i]['quote']['USD']['percent_change_1h'],
                        percent_change_24h: foopData[i]['quote']['USD']['percent_change_24h'],
                        percent_change_7d: foopData[i]['quote']['USD']['percent_change_7d'],
                        percent_change_30d: foopData[i]['quote']['USD']['percent_change_30d'],
                        percent_change_60d: foopData[i]['quote']['USD']['percent_change_60d'],
                        percent_change_90d: foopData[i]['quote']['USD']['percent_change_90d'],
                        market_cap: foopData[i]['quote']['USD']['market_cap'],
                        created_date: new Date()
                    }

                    console.log(insertedArray)
                    let where = { symbol: json.data[i]['symbol'] }
                    db.collection('market_prices').updateOne(where, { $set: insertedArray }, { upsert: true }, async (err, result) => {
                        if (err) {

                            console.log('We are Getting some DataBase Error!!')
                        } else {

                            console.log('Updated SuccessFully Market Prices!!!')
                        }
                    })

                }//end loop

            }).catch(err => console.log(err))




        })
    },

    //get news crone working and live
    getNews: () => {
        conn.then((db) => {

            let tags = [];
            db.collection('tags').find({}, async (err, result) => {

                if (err) {
                    console.log('error in tag')
                } else {
                    let response = await result.toArray()

                    tags = response.map(el => el.tagname)
                    console.log('tag name', tags)
                }
            })

            fetch('https://min-api.cryptocompare.com/data/v2/news/', {
                method: 'GET',
                headers: {
                    'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
                    'cache-control': 'no-cache',
                    Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(json => {
                let newsData = json.Data

                for (var i = 0; i < newsData.length; i++) {

                    for (var tag = 0; tag < tags.length; tag++) {

                        console.log('news tag ==================>>>', newsData[i]['tags'])

                        let result = newsData[i]['tags'].search(tags[tag])
                        if (result > 0 && result != undefined) {
                            let insertedArray = {

                                tag_name: tags[tag],
                                new_title: newsData[i]['title'],
                                published_on: newsData[i]['published_on'],
                                imageurl: newsData[i]['imageurl'],
                                url: newsData[i]['url'],
                                source: newsData[i]['source'],
                                body: newsData[i]['body'],
                                inserted_date: new Date()
                            }

                            db.collection('news').insertOne(insertedArray, (err, result) => {

                                if (err) {

                                    console.log('error in news cron in DB!')
                                }
                            })
                        }//end if

                    }//end inner tag loop 

                }//end outer loop
            }).catch(err => console.log(err))

        })
    },//end news crone


    //working and live
    market_prices_preciousMetal: () => {
        conn.then((db) => {
            fetch('https://metals-api.com/api/latest?access_key=xjpinixixt3vuek82k76c2rh1v9391xrmhmb8cqv94phxzi5zpj68zb5z8ht', {
                method: 'GET',
                headers: {
                    'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
                    'cache-control': 'no-cache',
                    Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(json => {

                // console.log(json.error.info)
                console.log(json)
                let rate = {
                    Gold: 1 / json.rates.XAU,
                    Silver: 1 / json.rates.XAG,
                    Platinum: 1 / json.rates.XPT,
                    Palladium: 1 / json.rates.XPD,
                    Rhodium: 1 / json.rates.XRH,
                    Ruthenium: 1 / json.rates.RUTH,
                    Nickel: 1 / json.rates.NI,
                    Copper: 1 / json.rates.XCU,
                    Aluminium: 1 / json.rates.ALU,
                    Zinc: 1 / json.rates.ZNC,
                    Tin: 1 / json.rates.TIN,
                    Currencies: json.rates
                }

                let arrayRewrite = {

                    timestamp: json.timestamp,
                    base_currency: json.base,
                    rates: rate,
                    unit: json.unit,
                    inserted_date: new Date()
                }

                console.log(arrayRewrite)

                let where = { base_currency: json.base }
                db.collection('market_prices_precious_metal').updateOne(where, { $set: arrayRewrite }, { upsert: true }, (err, result) => {
                    if (err) {

                        console.log('We are Getting some DataBase Error!!')
                    } else {

                        console.log('Updated SuccessFully!!!')
                    }
                })

            }).catch(err => console.log(err))
        })
    }, //end precious metal crone 


    //under progress
    market_stack: () => {
        conn.then((db) => {
            // http://api.marketstack.com/v1/eod?access_key=7684073799692bd826a8e1ba77466ac8&symbols=AAPL,MSFT&date_from=2021-06-01T00:00:00+0000&date_to=2021-06-02T00:00:00+0000
            // fetch('http://api.marketstack.com/v1/eod?access_key=7684073799692bd826a8e1ba77466ac8&symbols=AAPL', {
            //     method: 'GET',
            //     headers: { 
            //     'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
            //     'cache-control': 'no-cache',
            //     Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
            //     'Content-Type': 'application/json'  
            //     }
            //     }).then(res => res.json()).then(json => {

            //     let rate = {

            //         Gold     :   1 / json.rates.XAU,
            //         Silver   :   1 / json.rates.XAG,
            //         Platinum :   1 / json.rates.XPT,
            //         Palladium:   1 / json.rates.XPD,
            //         Rhodium  :   1 / json.rates.XRH,
            //         Ruthenium :  1 / json.rates.RUTH,
            //         Nickel   :   1 / json.rates.NI,
            //         Copper   :   1 / json.rates.XCU,
            //         Aluminium:   1 / json.rates.ALU,
            //         Zinc     :   1 / json.rates.ZNC,
            //         Tin      :   1 / json.rates.TIN
            //     }

            //     let arrayRewrite = {

            //         timestamp       :   json.timestamp,
            //         base_currency   :   json.base,
            //         rates           :   rate,
            //         unit            :   json.unit,
            //         inserted_date   :   new Date()
            //     }

            //     console.log(arrayRewrite)

            //     let where = {base_currency : json.base}
            //     db.collection('market_prices_precious_metal').updateOne(where, {$set : arrayRewrite}, {upsert: true}, (err, result) => {
            //         if(err){

            //             console.log('We are Getting some DataBase Error!!')
            //         }else{

            //             console.log('Updated SuccessFully!!!')
            //         }
            //     })

            // }).catch(err =>  console.log(err)) 

        })
    },


    getmarket_stack_company_details: () => {
        conn.then(async (db) => {

            var currentTime = new Date();
            var startDate = new Date(currentTime);
            startDate.setDate(startDate.getDate() - 1);
            startDate = dateFormat(startDate, "yyyy-mm-dd 00:00:00");
            let endDate = dateFormat(currentTime, "yyyy-mm-dd 00:00:00");

            let pageNumber = 1;
            for (var a = 1; a <= 10; a++) {

                var getmarketShareSymbol = await helperCon.getmarketShareSymbols(pageNumber)
                var symbols = getmarketShareSymbol.map(el => el.symbol);

                symbols = symbols.join()

                fetch('http://api.marketstack.com/v1/eod?access_key=21773cfa1a44acdd3a77e4c3c0da6fe5&symbols=' + symbols + '&date_from=' + startDate + '&date_to=' + endDate + '&limit=200', {

                    method: 'GET',
                    headers: {
                        'Postman-Token': '34a36f0e-88f4-4d46-8d2b-c0f5e620d71d',
                        'cache-control': 'no-cache',
                        Authorization: 'Basic ZGlnaWVib3QuY29tOllhQWxsYWg=',
                        'Content-Type': 'application/json',
                    }
                }).then(res => res.json())
                    .then(async json => {

                        let marketData = json.data

                        console.log(marketData)
                        if (json.error) {

                            console.log(json.error)
                        } else {

                            console.log('count total: ', marketData.length)
                            for (var i = 0; i < marketData.length; i++) {

                                let matchsFind = {
                                    symbol: marketData[i]['symbol'],
                                    date: marketData[i]['date']
                                }

                                let insertArrayCreate = {
                                    created_date: new Date(),
                                    open: marketData[i]['open'],
                                    high: marketData[i]['high'],
                                    low: marketData[i]['low'],
                                    close: marketData[i]['close'],
                                    volume: marketData[i]['volume'],
                                    adj_high: marketData[i]['adj_high'],
                                    adj_low: marketData[i]['adj_low'],
                                    adj_close: marketData[i]['adj_close'],
                                    adj_open: marketData[i]['adj_open'],
                                    adj_volume: marketData[i]['adj_volume'],
                                    split_factor: marketData[i]['split_factor'],
                                    symbol: marketData[i]['symbol'],
                                    exchange: marketData[i]['exchange'],
                                    date: marketData[i]['date']
                                }

                                await db.collection('market_stack_details').updateOne(matchsFind, { $set: insertArrayCreate }, { upsert: true })
                            }//end loop
                        }
                        console.log('Successfully Done!!!')
                    });

                pageNumber++;
                await helperCon.sleep(10000)//10 sec
            }//end outer loop
        })
    },


    marketTicker: () => {
        conn.then(async (db) => {
            let symbolsArray = await helperCon.getSymbols()
            var coins = symbolsArray.map(el => el._id);

            binance.websockets.candlesticks(coins, "1h", (candlesticks) => {
                let { e: eventType, E: eventTime, s: symbol, k: ticks } = candlesticks;
                let { o: open, h: high, l: low, c: close, v: volume, n: trades, i: interval, x: isFinal, q: quoteVolume, V: buyVolume, Q: quoteBuyVolume } = ticks;

                var insertArray = {
                    symbol: symbol,
                    open: open,
                    high: high,
                    low: low,
                    close: close,
                    volume: volume,
                    eventTime: eventTime,
                    time: new Date(),
                }
                console.log(insertArray)

                let whereMatch = {
                    symbol: symbol,
                    high: high,
                }

                db.collection('market_chart').updateOne(whereMatch, { $set: insertArray }, { 'upsert': true }, (err, result) => {
                    if (err) { } else {
                        console.log('Done!!')
                    }
                })
            });
        })
    }

}//end crone