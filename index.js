/**
 * Scrapes Job Postings based on an input value
 */


const puppeteer = require('puppeteer');
const delay = require('delay');
const fs = require('fs');
const Common = require('./common');
const Config = require('./config');

// results
let companyResults = {};

const readFile = (path) => {
    return fs.readFileSync(path).toString().split("\n");
};

/**
 * Basic navigation
 * @param page browser.Page
 * @param url String
 * @returns {Promise<*>}
 */
const navigateTo = async (page, url) => {
    await page.goto(url);
};

const clickNext = async (page, selector) => {
    const spanBtns = await getAllElements(page, selector);
    let nxtBtn;
    if (spanBtns.length  > 1) {
        nxtBtn = spanBtns[1];
    } else {
        nxtBtn = spanBtns[0];
    }
    await nxtBtn.click();
    await delay(2000);
};

/**
 * Get all elements that match the selector
 * @param page
 * @param selector
 * @returns {Promise<*>}
 */
const getAllElements = async (page, selector) => {
    return await page.$$(selector);
};

const getElement = async (page, selector) => {
    return await page.$(selector);
};

const closePopover = async (page, selector) => {
    const el = await getElement(page, selector);
    await el.click({ clickCount: 2});
};

const checkExists = async (page, selector) => {
    const el = await getElement(page, selector);
    return !!el;
};

const checkNext = async (page, selector) => {
    const el = await getAllElements(page, selector);
    return el.length === 2;
};

/**
 * Handles getting and storing the search results
 * The nested loops is a design decision allowing the program to scale as you want to remove and add properties
 * along with the count
 * @param page browser.Page
 * @param selector String
 * @returns {Promise<void>}
 */
const handleResults = async (page, selector) => {
    const companies = await getCompanies(page, selector.company);
    // add company and count to result object
    companies.forEach((company) => {
        addCompanyCount(company);
    });
    let properties = Object.keys(selector);
    properties.shift();
    // add properties
    for (const p of properties) {
        const results = await getAllElements(page, selector[p]);
        let index = 0;
        for (const result of results) {
            const data = await (await result.getProperty('innerText')).jsonValue();
            addCompanyProperty(companies[index], p, data);
            index++;
        }
    }
};

const test = async (page) => {
    let elements = await getAllElements(page, Config.selectors.indeed.results.row);
    for (const el of elements) {
        const data = await el.evaluate(el => {
            compan
        }, Config);
        console.log(data);
    }
};

/**
 * Adds company count
 * @param company String
 */
const addCompanyCount = (company) => {
    if (companyResults[company] && companyResults[company].count >= 1) {
        let currCount = companyResults[company].count;
        currCount++;
        companyResults[company].count = currCount;
    } else {
        companyResults[company] = {
            count: 1
        }
    }
};

/**
 * Adds company properties to that company
 * @param company String
 * @param property String
 * @param data String
 */
const addCompanyProperty =  (company, property, data) => {
    if (companyResults[company][property]) {
        let curr = companyResults[company][property];
        curr.push(data);
        companyResults[company][property] = curr;
    } else {
        let def = [];
        def.push(data);
        companyResults[company][property] = def;
    }
};

/**
 * Returns array of companies
 * @param page browser.Page
 * @param selector String
 * @returns {Promise<[]>}
 */
const getCompanies = async (page, selector) => {
    let companies = [];
    const rows = await getAllElements(page, selector);
    for (const row of rows) {
        const data = await (await row.getProperty('innerText')).jsonValue();
        companies.push(data);
    }
    return companies;
};

/**
 * Clears the input field, then types the result
 * @param page browser.Page
 * @param selector String
 * @param input String
 * @param location String
 * @returns {Promise<void>}
 */
const inputSearchParams = async (page, selector, input, location) => {
    const searchInputs = await getAllElements(page, selector.main);
    // focus clear type
    searchInputs[0].focus();
    await Common.clearTextField(page, selector.desc);
    await Common.type(searchInputs[0], input);

    searchInputs[1].focus();
    await Common.clearTextField(page, selector.loc);
    await Common.type(searchInputs[1], location);
};

/**
 * Clicks the button to generate results
 * @param page browser.Page
 * @param selector String
 * @returns {Promise<void>}
 */
const submit = async (page, selector) => {
    const submitBtn = await getElement(page, selector);
    await Common.navigateClick(page, submitBtn, Config.selectors.indeed.results.row, true);
};

(async () => {
    // get .txt values
    const args = readFile('./input/input.txt');
    // establish browser and page
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 1000
    });
    // navigate to indeed landing page
    await navigateTo(page, Config.urls.indeed);
    // loop through and perform search
    for (const arg of args) {
        if (!arg) continue; // skip empty lines
        let input = arg.split(" ")[0].match((/[A-Za-z, ]+/))[0];
        let location = arg.split(" ")[1].match((/[A-Za-z, ]+/));
        try {
            // grab input fields
            await inputSearchParams(page, Config.selectors.indeed.inputs.search, input, location);
            // submit result
            await submit(page, Config.selectors.indeed.inputs.submit);
            // delay for now
            await delay(2000);
            // handle popup
            if (await checkExists(page, Config.selectors.indeed.results.popover)) {
                await closePopover(page, Config.selectors.indeed.results.closePopover);
            };

            // await test(page);

            // gather results
            let next;
            do {
                next = await checkNext(page, Config.selectors.indeed.results.next);
                await handleResults(page, Config.selectors.indeed.results.details);
                if (next) {
                    await clickNext(page, Config.selectors.indeed.results.next);
                    if (await checkExists(page, Config.selectors.indeed.results.popover)) {
                        await closePopover(page, Config.selectors.indeed.results.closePopover);
                    };
                }
            } while (next);

            // todo: read into excel
            console.log(companyResults);
        } catch (err) {
            console.log('Error: ', err);
        }
    }
    // close browser
    await browser.close();
})();
