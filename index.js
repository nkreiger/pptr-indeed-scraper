/**
 * Scrapes Job Postings based on an input value
 */


const puppeteer = require('puppeteer');
const delay = require('delay');
const Common = require('./common');
const Config = require('./config');

// results
let companyResults = {};

(async (args) => {
    /* at end to run
    const input = args[2];
    const location = args[3];
     */
    const input = 'engineer';
    const location = 'pittsburgh, pa';

    try {
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

        // grab input fields
        await inputSearchParams(page, Config.selectors.indeed.inputs.search, input, location);
        // submit result
        await submit(page, Config.selectors.indeed.inputs.submit);

        // gather results
        /*
        let next = true;
        do {
            let results = await getAllElements(page, Config.selectors.indeed.results.company);
            await addResults(page, results);
            await clickNext(page, Config.selectors.indeed.results.next);
            if (await checkExists(page, Config.selectors.indeed.results.popover)) {
                await closePopover(page, Config.selectors.indeed.results.closePopover);
            }
            next = await checkNext(page, Config.selectors.indeed.results.next);
        } while (next);
         */
        let next;
        do {
            await handleResults(page, Config.selectors.indeed.results.details);
            next = await checkNext(page, Config.selectors.indeed.results.next);
        } while (next);

        console.log(companyResults);
        await browser.close();
    } catch (err) {
        console.log('Error: ', err);
    }
})(process.argv);

/**
 * Basic navigation
 * @param page browser.Page
 * @param url String
 * @returns {Promise<*>}
 */
const navigateTo = async (page, url) => {
    await page.goto(url);
};

const addResults = async (page, results) => {
    for (let result in results) {
        const data = await (await results[result].getProperty('innerText')).jsonValue();
        if (companyResults[data] >= 1) {
            let currResults = companyResults[data];
            currResults++;
            companyResults[data] = currResults;
        } else {
            // default to 1
            companyResults[data] = 1;
        }
    }
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
}
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
    const el = await getElement(page, selector)
    return !!el;
};

const checkNext = async (page, selector) => {
    const el = await getAllElements(page, selector);
    return el.length === 2;
};

const handleResults = async (page, selector) => {
    const companies = await getCompanies(page, selector.company);
    companies.forEach((company) => {
        if (companyResults[company] && companyResults[company].count >= 1) {
            let currCount = companyResults[company].count;
            currCount++;
            companyResults[company].count = currCount;
        } else {
            companyResults[company] = {
                count: 1
            }
        }
    });
    let keys = Object.keys(selector);
    keys.shift();
    for (const el of keys) {
        const results = await getAllElements(page, selector[el]);
        let index = 0;
        for (const result of results) {
            const data = await (await result.getProperty('innerText')).jsonValue();
            let company = companies[index];
            if (companyResults[company][el]) {
                let curr = companyResults[company][el];
                curr.push(data);
                companyResults[company][el] = curr;
            } else {
                let def = [];
                def.push(data);
                companyResults[company][el] = def;
            }
            index++;
        }
    }
};

const getCompanies = async (page, selector) => {
    let companies = [];
    const rows = await getAllElements(page, selector);
    for (const row of rows) {
        const data = await (await row.getProperty('innerText')).jsonValue();
        companies.push(data);
    }
    return companies;
};

const addResult = (result) => {
    console.log(result);
    const parsed = result.split("\n");
    console.log(parsed);
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
