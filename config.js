export const selectors = {
    indeed: {
        inputs: {
            search: "input[id$='what'],input[id$='where']",
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

export const urls = {
    indeed: 'https://www.indeed.com/'
};
