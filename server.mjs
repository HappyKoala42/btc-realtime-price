import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import bp from "body-parser";


cors ({
    origin: 'http://localhost:3000/',
    allowedHeaders: 
    [
        "origin",
        "x-Requested-With",
        "content-Type",
        "Accept",
        "Authorization"
    ],
    credentials: true,
    methods: "POST"
})

const port = 3000;
const app = express();
app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));


let url = "https://api.binance.com/api/v1/ticker/24hr"
let currency = 'BTCUSDT'
var memory = 25000;
var prices = [];
var clocks = [];
var dates = [];

var outPrices = [];
var outClocks = [];
var outDates = [];

async function getDate()
{
    var today = new Date().toLocaleDateString("en-GB", {
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
    today = today.replace(/,/g,'');
    return today;
}


async function scrapePrice()
{
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        const [element] = await page.$x('/html/body/pre');
        const context = await element.getProperty('textContent');
        var string = await context.jsonValue();
        await browser.close(); 

        string = string.substring(string.indexOf(currency));
        string = string.split("symbol")[0];
        string = string.replace(/"|,|:|{|}/g,'');
        string = string.substring(string.indexOf("lastPrice")+9);
        string = string.split("lastQty")[0];
        prices.push(parseFloat(string)); 
        clocks.push(Math.round((new Date().getTime())/1000));
        dates.push(await getDate()); 

        if(prices.length > memory)
        {
            prices.shift();
            clocks.shift();
            dates.shift();
        }

        await Promise.reject(new Error('scrapePrice'));
}

function prepData(interval)
{
    outPrices = [];
    outClocks = [];
    outDates = [];

    var copyPrices = prices;
    var copyClocks = clocks;
    var copyDates = dates;

    var intervalTime = Math.round((new Date().getTime())/1000) - interval;

    for(let i = copyPrices.length-1; i > -1; i--)
    {
        if(copyClocks[i] > intervalTime)
        {
            outPrices.unshift(copyPrices[i]);
            outClocks.unshift(copyClocks[i]);
            outDates.unshift(copyDates[i]);
        }
        else
            i = -1;
    }
}

(function()
{ 
    app.post("/", (req, res) => 
    {
        prepData(req.body.bufferTime);
        console.log(Math.round((new Date().getTime())/1000)+' - got pinged');
        res.json({
            currency: currency,
            prices: outPrices,
            clocks: outClocks,
            dates: outDates
        }),
        res.end();
    })
    app.listen(port, () => {console.clear(),console.log('Tuning on port 3000','\n--------------------')})
})();

(async function loop() 
{
    setTimeout(async function () 
    {   
        await scrapePrice().catch(() => {});
        await loop();
    }, 1000);
}()); 