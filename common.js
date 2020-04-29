class Common {
    async clearTextField(page, selector) {
        await page.evaluate(selector => {
            document.querySelector(selector).value = "";
        }, selector);
    }

    async click(element, count) {
        await element.click({ clickCount: count })
    }
}

module.exports = Common;
