import { getProxyType, areProxiesEntered, getProxies } from "./Settings.js"


const screenSwitchers = document.getElementsByClassName("results");
const averageLatency = document.getElementById("res-avg");
const workingProxies = document.getElementById("res-working");
const deadProxies = document.getElementById("res-dead");
const checkedProxies = document.getElementById("res-checked");
const proxyArea = document.getElementById("textarea");
const resultsTable = document.getElementsByTagName("tbody")[0];


document.getElementById("start").addEventListener("click", async () => {
    const errorElement = document.getElementById("status");
    const proxyType = getProxyType()?.toLowerCase();
    // Before checking we make sure the proxies are entered, and the proxy type is selected.
    if (!proxyType) {
        errorElement.style.display = 'block';
        errorElement.innerHTML = 'Selected a proxy type.';
        return;
    }
    const proxiesPresent = areProxiesEntered();
    if (!proxiesPresent) {
        errorElement.style.display = 'block';
        errorElement.innerHTML = 'Enter proxies first.';
        return;
    }


    //#region Main Table Information

    errorElement.style.display = 'none';
    const proxyList = getProxies(); // <textarea /> value
    const lines = proxyList.split("\n"); // lines of textarea
    screenSwitchers[0].innerHTML = `Results (${lines.length})`;

    document.getElementById("res-total").textContent = "Total: " + lines.length;
    //#endregion




    var ProxyStats = { // This information gets updated with each proxy check and gets displayed on the Results Screen
        working: 0,
        dead: 0,
        averageLatency: 0,
        latencyList: []
    }
    for (let i = 0; i < lines.length; i++) { // We loop through proxies and call my API to check them
        const currentProxy = lines[i];
        if (currentProxy === "") {
            // Prazna linija pa skipujemo iteraciju
            continue;
        }

        if (i === 0) {
            // As soon as 1 proxy is checked, we want the user to be able to switch to Results page, thats why we check for i === 0; (First proxy)
            // Also we check if the json (proxy response) actually returned a json
            screenSwitchers[0].style.display = 'block'; // We show the 'Results' button
        }
        checkProxies(currentProxy, proxyType, 5000).then((json) => {

            const row = resultsTable.insertRow(-1);
            const proxy = row.insertCell(0);
            const type = row.insertCell(1);
            const latency = row.insertCell(2);
            const status = row.insertCell(3);
            const location = row.insertCell(4);

            proxy.innerHTML = json.proxy;
            type.innerHTML = proxyType;
            latency.innerHTML = json.latency;
            status.innerHTML = json.status;
            location.innerHTML = json.location;
            checkedProxies.textContent = "Checked: " + i;
            // With each proxy checked, we update the object with latest information (ln. 43)

            if (parseInt(json.latency)) {
                ProxyStats.latencyList.push(parseInt(json.latency));
            }
            if (json.status === 200 || json.status === 302) {
                ProxyStats.working += 1;
            } else {
                ProxyStats.dead += 1;
            }
            ProxyStats.averageLatency = getAverageNumber(ProxyStats.latencyList);
            applyStats(ProxyStats);
        });
        // After fetching, we insert the data into the table.
    };


});
document.getElementById("import-clipboard").addEventListener("click", () => {
    if (!copyFromClipboard()) {
        proxyArea.value = 'Invalid clipboard data!';
        return;
    }

});
for (let k = 0; k < document.getElementsByClassName("results").length; k++) {
    document.getElementsByClassName("results")[k].addEventListener("click", switchView);
}
document.getElementById("import-url").addEventListener("click", async () => {
    const url = document.getElementById("import-input").value;
    const result = await copyFromURL(url);
    if (!result) {
        errorElement.style.display = 'block';
        errorElement.innerHTML = 'Could not fetch proxies. Make sure the URL points to a text file.';
    }
});

for (let i = 0; i < document.getElementsByClassName("prompt-close").length; i++) {
    // Every prompt has a close button, which takes it's parent (the prompt itself) and simply hides it.
    // We could destroy the element but it's not resource intensive and its impractical since when we want to add a new prompt, we need to write it in javascript
    const closePromptButton = document.getElementsByClassName("prompt-close")[i];
    const parentElement = closePromptButton.parentNode;
    closePromptButton.addEventListener("click", () => handlePrompt(parentElement, "none"));
}

document.getElementById("export-working").addEventListener("click", () => {
    // To export working proxies, we loop through rows of the table and check the status cell, if the status is 200, we add it to an array,
    // after that we create a Blob which is a text file and we download it
    var working = [];
    const rows = resultsTable.getElementsByTagName("tr");
    for (let i = 0; i < rows.length; i++) { // Loop through rows
        const cells = rows[i].getElementsByTagName("td");
        for (let k = 0; k < cells.length; k++) { // Loop through cells of rows
            var proxy, proxyStatus;
            if (k === 0) { proxy = cells[k].innerHTML }
            if (k === 3 && !isNaN(cells[k].innerHTML)) { // Status is cells[3] 
                const statusCell = cells[k].innerHTML;
                if (parseInt(statusCell) === 200 || parseInt(statusCell) === 302) {
                    working.push(proxy);
                }
            }
        }
    }
    const finalData = working.join("\n");
    const blob = new Blob([finalData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'working_proxies.txt';
    link.click();
    URL.revokeObjectURL(url);
    link.remove();

});
function handlePrompt(prompt, visibility) {
    // Hides or shows a prompt based on the prop
    prompt.style.display = visibility;
}

function switchView() {
    // We have 2 screens in this app, the checker and the results screen showing the results of the proxy checking. This function simply toggles that.
    const checkerView = document.getElementById("checker-modal");
    const resultsView = document.getElementById("results-modal");

    if (checkerView.style.display === 'none') {
        resultsView.style.display = 'none';
        checkerView.style.display = 'block';
    }
    else {
        resultsView.style.display = 'block';
        checkerView.style.display = 'none';
    }
}
function getAverageNumber(list) {
    // We use this to get the average latency of all the proxies
    let sum = 0;
    for (let i = 0; i < list.length; i++) {
        sum += list[i];
    }
    const length = list.length;
    const average = sum / length;
    return average.toFixed(0);
}
function applyStats(proxyStats) {
    // We also have additional statistics about proxies, working count, dead count, avg latency, etc. Every time a proxy gets checked, this gets called (So we update the latest info)
    workingProxies.textContent = "Working: " + proxyStats.working;
    deadProxies.textContent = "Dead: " + proxyStats.dead;
    averageLatency.textContent = "Average latency: " + proxyStats.averageLatency + " ms";
}
async function copyFromClipboard() {
    const clipboardData = await navigator.clipboard.readText();
    if (!clipboardData) {
        return false;
    }
    proxyArea.value = clipboardData;
    return true;
}
async function copyFromURL(url) {
    // Copies proxies from a text file with HTTP
    const fetchText = await fetch(url);
    const text = await fetchText.text();
    if (!text || fetchText.status != 200) {
        return false;
    }
    proxyArea.value = text;
    return true;
}


async function checkProxies(proxy, type, timeout) {
    const url = `https://5902-178-221-78-146.ngrok-free.app/checkProxy/?proxy=${proxy}&type=${type}&timeout=${timeout}`;

    try {
        const response = await fetch(url, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            return jsonResponse;
        } else {
            throw new Error('Request failed with status ' + response.status);
        }
    } catch (error) {
        return null;
    }
}