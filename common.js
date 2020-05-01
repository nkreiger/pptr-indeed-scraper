const clearTextField = async (page, selector) => {
    await page.evaluate(selector => {
        document.querySelector(selector).value = "";
    }, selector);
};

const getElementInnerText = async (element) => {
    const text = await element.evaluate(node => node.innerText);
    return text;
};

const queryElement = async (node, selector) => {
    let res = node.evaluate(el => {
        let res = document.querySelector(selector);
        return res;
    });
    return res;
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
    getElementInnerText,
    queryElement,
    type,
    navigateClick,
    click
};
