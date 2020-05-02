const selectors = {
    indeed: {
        inputs: {
            search: {
                main: "input[id$='what'],input[id$='where']",
                desc: "input[id$='what']",
                loc: "input[id$='where']",
            },
            submit: "button[class$='WhatWhere-button'],input[class='input_submit']"
        },
        results: {
            next: {
                span: "span[class='pn']",
                arrow: "a[aria-label*='Next']"
            },
            row: "div[class*='unifiedRow']",
            details: {
                job_title: "h2[class='title']",
                rating: "span[class='ratingsContent']",
                location: "div[class*='location']",
                summary: "div[class*='summary']"
            },
            key: "span[class='company']",
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
