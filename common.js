const clearTextField = async (page, selector) => {
    await page.evaluate(selector => {
        document.querySelector(selector).value = "";
    }, selector);
};

const click = async (element, count) => {
    await element.click({clickCount: count})
};

module.exports = {
    clearTextField,
    click
};
