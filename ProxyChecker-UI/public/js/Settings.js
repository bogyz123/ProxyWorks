const ELEMENT_SELECTED = 'rgb(0, 128, 0) none repeat scroll 0% 0% / auto padding-box border-box';
const ELEMENT_UNCHECKED = 'rgb(26, 26, 26) none repeat scroll 0% 0% / auto padding-box border-box';
const letters = [ // Used to check if proxy is valid (line doesnt contain a letter)
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
];



const settingItems = document.getElementById("type-settings").getElementsByClassName("setting");
// When a user tries to select a proxy type on the main screen, the button turns green. User should not select more than 1 proxy type
// So we check if any of the buttons is already green
for (let i = 0; i < settingItems.length; i++) {
    settingItems[i].addEventListener("click", (event) => {
        if (isProxyTypeSelected(event.target)) {
            return;
        }
        const caller = event.target;
        const style = window.getComputedStyle(caller);
        // If the button is green, uncheck it, otherwise check it (toggler).
        if (style.background === 'rgb(26, 26, 26) none repeat scroll 0% 0% / auto padding-box border-box') {
            caller.style.background = 'green';
        }
        else {
            caller.style.background = 'rgb(26,26,26)'
        }
    });
}

document.querySelector("input[type='file']").addEventListener("change", (e) => {
    // Upload proxies
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        document.querySelector("textarea").textContent = e.target.result;
    };
    reader.readAsText(file);
});
function isProxyTypeSelected(self) {
    for (let i = 0; i < settingItems.length; i++) {
        const isSelected = window.getComputedStyle(settingItems[i]).background === ELEMENT_SELECTED;
        if (isSelected && window.getComputedStyle(self).background != ELEMENT_SELECTED) {
            return true;
        }
        // But we also want to allow unchecking of a proxy type, so we check if any button is already selected and the button we just clicked is NOT selected then return true
        // So, when we select a proxy type you can ONLY click the same one (deselect it) otherwise nothing will happen when this function is called (we return)
    }
}
export function getProxyType() { // Get the selected proxy type
    for (let i = 0; i < settingItems.length; i++) {
        if (window.getComputedStyle(settingItems[i]).background === ELEMENT_SELECTED) {
            return settingItems[i].innerHTML;
        }
    }
    return null;
}
export function areProxiesEntered() {
    return document.querySelector("textarea").value.length > 0;
}
export function getProxies() {
    return document.querySelector("textarea").value;
}
export function isValidProxy(proxy) {

    if (!proxy.split(":")) { // If proxy doesnt have IP:PORT separator
        return false;
    }
    for (let i = 0; i < letters.length; i++) { // If proxy has a letter
        if (proxy.includes(letters[i])) {
            return false;
        }
    }
    if (parseInt(proxy.split(":")[1]) > 65535) { // If port is more than the max port number
        return false;
    }
    return true;
}