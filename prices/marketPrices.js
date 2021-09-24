
const cron          =   require('node-cron');
const { market_prices_preciousMetal } = require('../crons/croneJobs');
const priceTicket   =   require('../crons/croneJobs')

    //binance current market prices crone now this is stop
    cron.schedule('*/2 * * * * *', () => {
        
        priceTicket.price();
    });

    //get last 24H change
    cron.schedule('*/8 * * * * *' , () => {

        priceTicket.last24HoursChange()
    })

    cron.schedule('0 */60 * * * *', () => {
        
        priceTicket.getNews();
    });

    cron.schedule('0 0 */20 * * *' , () => {
        // cron.schedule('0 * */ * * *' , () => {


        priceTicket.market_prices_preciousMetal()
    })

    //coin market cap current market prices crone
    cron.schedule('*/2 * * * * *', () => {

        // priceTicket.coinMarketCapPricesCrone()
    })

    // market stack
    cron.schedule('0 0 */23 * * *', () => {

        priceTicket.getmarket_stack_company_details()
    })

    cron.schedule('0 0 */2 * * *' , () => {

        priceTicket.marketTicker()
    })