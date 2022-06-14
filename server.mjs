import puppeteer from "puppeteer";
import express from "express";
import cars from "cars";
import bp from "body-parser";

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

(async function loop() {
    setTimeout(async function() {
        await scrapePrice();
        // call scrapePrice
    });
});