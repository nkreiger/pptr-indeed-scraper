const clearTextField = async (page, selector) => {
    await page.evaluate(selector => {
        document.querySelector(selector).value = "";
    }, selector);
};

const type = async (element, text) => {
    await element.focus();
    await element.type(text, { delay: 50 });
};

const click = async (element, count) => {
    await element.click({clickCount: count})
};

const navigateClick = async (page, element, navSelector, opts=false) => {
    await Promise.all([
        element.click(),
        page.waitForNavigation(),
        navSelector ? page.waitForSelector(navSelector, {visible: opts}) : null
    ])
};

module.exports = {
    clearTextField,
    type,
    navigateClick,
    click
};
