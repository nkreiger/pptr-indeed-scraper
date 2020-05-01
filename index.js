/**
 * Scrapes Job Postings based on an input value
 */


const puppeteer = require('puppeteer');
const delay = require('delay');
const fs = require('fs');
const { format } = require('date-fns');
const XLSX = require('xlsx');
const Common = require('./common');
const Config = require('./config');

// results
let companyResults = {};

const readFile = (path) => {
    return fs.readFileSync(path).toString().split("\n");
};

const formatToExcel = (result) => {
    let formatted = Object.keys(result).map((key) => {
        return {
            company: key,
            count: result[key].count,
            postings: JSON.stringify(result[key].postings)
        }
    });
    return formatted;
};

const writeResultsExcel = (results, input, location) => {
    console.log('writing: ', results);
    let fileName = format(new Date(), 'MM-dd-yyyy-k:mm:ss') + `_${input}_${location}.xlsx`;
    try {
        fs.writeFileSync(`./output/${fileName}`);
        const ws = XLSX.utils.json_to_sheet(formatToExcel(companyResults));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${input}_${location}`);
        XLSX.writeFile(wb, `./output/${fileName}`);
    } catch (err) {
        console.log('Failed to write results to excel: ', err);
    }
}

const createFile = (path) => {
    return fs.writeFileSync(path);
}

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

const handlePopover = async (page) => {
    await delay(2000);
    if (await checkExists(page, Config.selectors.indeed.results.popover)) {
        await closePopover(page, Config.selectors.indeed.results.closePopover);
        await delay(1000);
        return true;
    }
    return false;
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
    // todo: use evaluate to check if next actually exists since no unique id
    const elements = await getAllElements(page, selector);
    for (const el of elements) {
        const text = await Common.getElementInnerText(el);
        if (text.toLowerCase().includes('next')) return true;
    }
    return false;
};

/**
 * Handles getting and storing the search results
 * The nested loops is a design decision allowing the program to scale as you want to remove and add properties
 * along with the count
 * @param page browser.Page
 * @returns {Object}
 */
const handleResults = async (page) => {
   companyResults = await page.evaluate(async (Config, companyResults) => {
        const addOrIncrement = (company) => {
            if (companyResults[company] && companyResults[company].count >= 1) {
                let currCount = companyResults[company].count;
                currCount++;
                companyResults[company].count = currCount;
            } else {
                // create default company
                companyResults[company] = {
                    count: 1,
                    postings: []
                }
            }
        };

        const addPosting = async (company, posting) => {
            companyResults[company].postings.push(posting);
        };

        const getElementInnerText = async (el, selector) => {
            try {
                const data = el.querySelector(selector).innerText;
                return data;
            } catch (err) {
                return '';
            }
        };

        const searchRows = document.querySelectorAll(Config.selectors.indeed.results.row);
        let properties = Config.selectors.indeed.results.details;
        let propertyKeys = Object.keys(properties);
        for (const result of searchRows) {
            const company = await getElementInnerText(result, Config.selectors.indeed.results.key);
            if (company) await addOrIncrement(company);
            if (company) {
                let posting = {};
                for (const p of propertyKeys) {
                    const data = await getElementInnerText(result, properties[p]);
                    if (data) posting[p] = data;
                }
                await addPosting(company, posting);
            }
        }

        return companyResults;
    }, Config, companyResults).catch((err) => {
        console.log('No results found: ', err);
   });
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
    for (let i = 0; i < 2; i++) { // do it twice to remove cached
        searchInputs[0].focus();
        await Common.clearTextField(page, selector.desc);
        await Common.type(searchInputs[0], input);

        searchInputs[1].focus();
        await Common.clearTextField(page, selector.loc);
        await Common.type(searchInputs[1], location);
    }
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
        // assign search inputs
        let searchInputs = arg.split(" ");
        let input;
        let location;
        try {
            input = searchInputs[0].match((/[A-Za-z, ]+/))[0]
        } catch (err) {
            input = '';
        }
        try {
            location = searchInputs[1].match((/[A-Za-z, ]+/))[0]
        } catch (err) {
            location = '';
        }

        try {
            let companyResults = {};
            // grab input fields
            await inputSearchParams(page, Config.selectors.indeed.inputs.search, input, location);
            // submit result
            await submit(page, Config.selectors.indeed.inputs.submit);
            // handle popup
            await handlePopover(page);

            // gather results
            let next;
            do {
                next = await checkNext(page, Config.selectors.indeed.results.next).catch((err) => console.log(err));
               // await handleResults(page, Config.selectors.indeed.results.details); deprecated
                await handleResults(page);
                if (next) {
                    await clickNext(page, Config.selectors.indeed.results.next);
                    await handlePopover(page);
                }
            } while (next);
        } catch (err) {
            console.log('Error: ', err);
        }
    }
    // handle results
    console.log('total company results: ', companyResults);
    await writeResultsExcel(companyResults, "total", "total");
    // close browser
    await browser.close();
})();
