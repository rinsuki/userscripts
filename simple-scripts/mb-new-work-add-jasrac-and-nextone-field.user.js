// ==UserScript==
// @name        MB (New Work): Add JASRAC and NexTone ID Fields
// @namespace   https://rinsuki.net
// @match       https://musicbrainz.org/dialog?path=%2Fwork%2Fcreate
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @description Add JASRAC and NexTone ID Fields to New Work.
// ==/UserScript==

addEventListener("load", async () => {
    let workAttributesField
    while (null == (workAttributesField = document.getElementById("work-attributes"))) {
        await new Promise(r => setTimeout(r, 100))
    }
    const addButton = workAttributesField.querySelector("#add-work-attribute")
    addButton.click()
    addButton.click()
    while (Array.from(workAttributesField.querySelectorAll(`select[name="edit-work.attributes.1.type_id"] option`)).length < 10) {
        await new Promise(r => setTimeout(r, 100))
    }
    function selectSpecifiedOption(select, optionChecker) {
        const option = Array.from(select.querySelectorAll("option")).find(optionChecker)
        if (option == null) alert("cant find option!!")
        select.value = option.value
    }
    selectSpecifiedOption(workAttributesField.querySelector(`select[name="edit-work.attributes.0.type_id"]`), option => option.textContent.trim() === "JASRAC ID")
    selectSpecifiedOption(workAttributesField.querySelector(`select[name="edit-work.attributes.1.type_id"]`), option => option.textContent.trim() === "NexTone ID")
})