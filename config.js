const selectors = {
    indeed: {
        inputs: {
            search: {
                main: "input[id$='what'],input[id$='where']",
                desc: "input[id$='what']",
                loc: "input[id$='where']",
            },
            submit: "button[class$='WhatWhere-button']"
        },
        results: {
            next: "span[class='np']",
            row: "div[class*='unifiedRow']",
            details: {
                company: "span[class='company']",
                job_title: "h2[class='title']",
                rating: "span[class='ratingsContent']",
                location: "div[class*='location']",
                summary: "div[class*='summary']"
            },
            popover: "div[id*='popover']",
            closePopover: "a[class*='popover-x-button-close']",
        }
    }
};
const urls = {
    indeed: 'https://www.indeed.com/'
};

module.exports = {
    selectors,
    urls
};
