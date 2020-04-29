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
            popover: "div[id*='popover']",
            closePopover: "a[class*='popover-x-button-close']",
            company: "span[class='company'"
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
