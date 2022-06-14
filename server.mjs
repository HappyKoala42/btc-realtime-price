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
let memory;
let prices = [];

async function scrapePrice() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    const [element] = await page.$x('/html/body/pre');
    const context = await element.getProperties('textContent');
    let string = await context.jsonValue();
    
    
    // close the browser
    await browser.close();
    
    
    // eliminate other currencies
    string = string.substring(string.indexOf(currency));
    string = string.split("symbol")[0];
    string = string.replace(/"|,|:|{|}/g,'');
    string = string.substring(string.indexOf("lastPrice")+9);
    string = string.split("lastQty")[0];
    let price = parseFloat(string);

    if (prices.length > memory) {
        prices.shift();
    }

    await Promise.reject(new Error('scrapePrice'));
}

(function() {
    app.post("/", (req, res) => {
        console.log("Pinged");

        res.json({
            currency: currency,
            prices: prices
        }),

        res.end();
    })
    app.listen(port, () => {console.clear(), console.log("Listening to port 3000")});
}());

(async function loop() {
    setTimeout(async function() {
        await scrapePrice().catch(() => {});
        await loop();
        // console.log(prices);
    }, 1000);
}());