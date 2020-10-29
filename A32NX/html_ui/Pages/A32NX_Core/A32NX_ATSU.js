const endpoint = "https://api.flybywiresim.com/";
const msgSep = "---------------------------[color]white";
const srcMap = {
    "FAA": "faa",
    "IVAO": "ivao",
    "MSFS": "ms",
    "NOAA": "aviationweather",
    "PILOTEDGE": "pilotedge",
    "VATSIM": "vatsim"
};

function wordWrapToStringList(text, maxLength) {
    const result = [];
    let line = [];
    let length = 0;
    text.split(" ").forEach(function (word) {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(" "));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(" "));
    }
    return result;
}

function fetchTimeValue() {
    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    if (timeValue) {
        const seconds = Number.parseInt(timeValue);
        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
        timeValue = displayTime.toString();
        return timeValue.substring(0, 5);
    }
    return null;
}

const getMETAR = async (icaos, lines, store, updateView) => {
    const storedMetarSrc = NXDataStore.get("CONFIG_METAR_SRC", "MSFS");
    for (const icao of icaos) {
        if (icao !== "") {
            await fetch(`${endpoint}metar?source=${srcMap[storedMetarSrc]}&icao=${icao}`)
                .then((response) => response.text())
                .then((data) => {
                    const error = data.slice(0, 9) == "FBW_ERROR";
                    if (!error) {
                        lines.push(`METAR ${icao}[color]blue`);
                        const newLines = wordWrapToStringList(data, 25);
                        newLines.forEach(l => lines.push(l.concat("[color]green")));
                        lines.push(msgSep);
                    } else {
                        lines.push(`METAR ${icao}[color]blue`);
                        lines.push('STATION NOT AVAILABLE[color]red');
                        lines.push(msgSep);
                    }
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getTAF = async (icaos, lines, store, updateView) => {
    const storedTafSrc = NXDataStore.get("CONFIG_TAF_SRC", "NOAA");
    for (const icao of icaos) {
        if (icao !== "") {
            await fetch(`${endpoint}taf?source=${srcMap[storedTafSrc]}&icao=${icao}`)
                .then((response) => response.text())
                .then((data) => {
                    const error = data.slice(0, 9) == "FBW_ERROR";
                    if (!error) {
                        lines.push(`TAF ${icao}[color]blue`);
                        const newLines = wordWrapToStringList(data, 25);
                        newLines.forEach(l => lines.push(l.concat("[color]green")));
                        lines.push(msgSep);
                    } else {
                        lines.push(`TAF ${icao}[color]blue`);
                        lines.push('STATION NOT AVAILABLE[color]red');
                        lines.push(msgSep);
                    }
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getATIS = async (icao, lines, type, store, updateView) => {
    const storedAtisSrc = NXDataStore.get("CONFIG_ATIS_SRC", "FAA");
    if (icao !== "") {
        await fetch(`${endpoint}atis?source=${srcMap[storedAtisSrc]}&icao=${icao}`)
            .then((response) => response.json())
            .then((data) => {
                const error = "error" in data;
                if (!error) {
                    let atisData;
                    switch (type) {
                        case 0:
                            if ("arr" in data) {
                                atisData = data.arr;
                            } else {
                                atisData = data.combined;
                            }
                            break;
                        case 1:
                            if ("dep" in data) {
                                atisData = data.dep;
                            } else {
                                atisData = data.combined;
                            }
                            break;
                        default:
                            atisData = data.combined;
                    }
                    lines.push(`ATIS ${icao}[color]blue`);
                    const newLines = wordWrapToStringList(atisData, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push(msgSep);
                } else {
                    lines.push(`ATIS ${icao}[color]blue`);
                    lines.push('D-ATIS NOT AVAILABLE[color]red');
                    lines.push(msgSep);
                }
            });
    }
    store["sendStatus"] = "SENT";
    updateView();
};