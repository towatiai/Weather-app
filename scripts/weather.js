//******************************************************************
//              -*- Weather app (CLIENT) -*-
//          for Reaktor's summerjob application
//
//      @author: Toni Tiainen
//      @version: 27.2.2018
//
// Few words: This application uses JSON-file as a database.
//  Many elements on the site is created based on that
//  data, so adding new cities would be as easy as possible.
//  Known decision to save temperatures only in Celsius-units,
//  but this probably should be changed to store exact
//  temperatures.
//
//******************************************************************


//*************** GLOBAL VARIABLES *****************
let data;                   // Local JSON-file
let sort_asc = true;        // Current sorting order (true if ascending, false if descending)
let current_city = '';      // Current chosen city
let unitC = true;           // Current chosen unit (true if Celsius, false if Fahrenheit)
let sortType = "temp";      // Current sorting type
let serverReady = true;     // True if server is ready to receive data, false if not.
let serverQueue = [];       // Queued data, that will be sent to server, when it's ready.


/**
 * Run's when web-site is ready.
 * Start's the initialization of the dynamic elements.
 */
$(function() {
    console.log("Site ready");
    initData();
});

/**
 * Loads the JSON-data from server, and starts initialization if data is OK.
 */
function initData() {
    data = $.getJSON('./data/weathers.json').done(() => {
        console.log("Loaded: JSON - data");
        data = data.responseJSON;
        console.log(data);
        initPage();
    }).fail(() => {
        console.log("Error when loading JSON - data.");
    });
}

/**
 * When JSON has been received, this runs init functions.
 */
function initPage() {

    initHeader();

    initForm();

    initDatalist();
}


/**
 * Initializes the header:
 *  - dynamically adds html-elements to header
 *  - adds unique ID's
 *  - creates changeable text-elements
 *  - adds click-events to elements
 *  - Creates UI - elements.
 */
function initHeader() {

    data.cities.map((city) => {
        //Creates informational boxes for every city
        $( "<div id='" + city.id + "_weather' class='weather'></div>" ).appendTo( ".weather_container" );
        $( "<h2>" + city.name + "</h2>" ).appendTo( "#" + city.id + "_weather");

        $( "<p class='city_coordinates'> " + getCoordinates(city) + " </p>" ).appendTo( "#" + city.id + "_weather");

        //Adds highest and lowest temperature
        $( "<div id='" + city.id + "_temp_container' class='temp_container'></div>" ).appendTo( "#" + city.id + "_weather" );
        $( "<div id='" + city.id + "_current_container' class='current_container'></div>" ).appendTo( "#" + city.id + "_temp_container" );
        $( "<div id='" + city.id + "_highest_container' class='highest_container'></div>" ).appendTo( "#" + city.id + "_temp_container" );
        $( "<div id='" + city.id + "_lowest_container' class='lowest_container'></div>" ).appendTo( "#" + city.id + "_temp_container" );
        $( "<h5 id='" + city.id + "_current' class='current'> " + fix(getCurrent(city.id)) + "</h5>").appendTo( "#" + city.id + "_current_container" );
        $( "<h5 id='" + city.id + "_highest' class='highest'>" + fix(getHighest(city.id)) + "</h5>").appendTo( "#" + city.id + "_highest_container" );
        $( "<h5 id='" + city.id + "_lowest' class='lowest'>" + fix(getLowest(city.id)) + "</h5>").appendTo( "#" + city.id + "_lowest_container" );

        //Creates tooltips
        $( "<span id='" + city.id + "highest_tooltip' class='tooltip' >" +
            "Highest temperature in the last 24 hours" +
            "</span>" ).appendTo("#" + city.id + "_highest_container");

        $( "<span id='" + city.id + "lowest_tooltip' class='tooltip' >" +
            "Lowest temperature in the last 24 hours" +
            "</span>" ).appendTo("#" + city.id + "_lowest_container");

        $( "<span id='" + city.id + "current_tooltip' class='tooltip' >" +
            "Most recent temperature" +
            "</span>" ).appendTo("#" + city.id + "_current_container");

        $( "<option>" + city.name + "</option>").appendTo( "#city_select");
    });

    // Adds click-event to every city-container, that updates the list
    data.cities.map((city) => {
        $( "#" + city.id + "_weather").click((event) => {
            updateList(sortType, city.id);
        });
    });

    //Adds hover-effect when page loads (only to F-switch, because C is default option)
    $( ".unit_F" ).hover(() => {
        $( ".unit_F" ).css("background", " #006bb1 ")
            .css("transition", "all 0.2s ease-in-out");
    }, () => {
        $( ".unit_F" ).css("background", "#0083b8")
            .css("transition", "all 0.2s ease-in-out");
    }).css("cursor", "pointer");

    // Adds click-events to F and C, that changes units on the page, and makes changes to UI.
    $( ".unit_C" ).click((event) => {
        if (unitC) return; // If unit C is already chosen, return (no point in doing same things again)
        unitC = true;
        data.cities.map((city) => {
            update(city.id);
        });

        updateList(sortType, current_city);

        $( ".unit_C" ).css("background", "#33afff")
            .css("cursor", "default")
            .unbind("mouseenter mouseleave");
        $( ".unit_F" ).css("background", "#0083b8")
            .css("cursor", "pointer")
            .hover(() => {
                $( ".unit_F" ).css("background", " #006bb1 ")
                    .css("transition", "all 0.2s ease-in-out");
            }, () => {
                $( ".unit_F" ).css("background", "#0083b8")
                    .css("transition", "all 0.2s ease-in-out");
            });
    });

    $( ".unit_F" ).click((event) => {
        if (!unitC) return; // If unit F is already chosen, return (no point in doing same things again)
        unitC = false;
        data.cities.map((city) => {
            update(city.id);
        });

        updateList(sortType, current_city);

        $( ".unit_F" ).css("background", "#33afff")
            .css("cursor", "default")
            .unbind("mouseenter mouseleave");
        $( ".unit_C" ).css("background", "#0083b8")
            .css("cursor", "pointer")
            .hover(() => {
                $( ".unit_C" ).css("background", " #006bb1 ")
                    .css("transition", "all 0.2s ease-in-out");
            }, () => {
                $( ".unit_C" ).css("background", "#0083b8")
                    .css("transition", "all 0.2s ease-in-out");
            });
    });

    $( ".header_name" ).click(() => {
        current_city = '';
        updateList(sortType, current_city);
    });
}


/**
 * Initializes the form:
 *  - Adds click-events to "Save"-button, that reads information from inputs
 */
function initForm() {

    $( "#form_button" ).click((event) => {
        let temperature;
        let unit = $( "#unit_select" ).val().slice(-1); // Takes only the letter C or F
        if (unit == "C") temperature = $( "#input_temperature" ).val();
        else temperature = FtoC($( "#input_temperature" ).val());
        let location = getCitybyName($( "#city_select" ).val()).id;
        let date = new Date();
        event.preventDefault();

        //Checks if user input is valid
        if (!validInput(temperature)) {
            console.log("Form submited with NaN input");
            $( "#input_temperature" ).css("border", "3px solid red");
            return;
        }
        $( "#input_temperature" ).css("border", "1px solid lightgray");

        let weather =
            '              {\n' +
            '                "temp": "' + temperature + '",\n' +
            '                "date": "' + date + '"\n' +
            '              }\n';

        // THe collected data is sent to the local JSON-file and to the server.
        handleLocal(weather, location, "add");
        handleServer(weather, location, "add");
    });
}


/**
 * Initializes the list's click-events that sort data.
 * Also handles UI, so user knows how data is been sorted.
 */
function initDatalist() {

    // Runs update-function:
    updateList(sortType, '');

    $( ".data_header_temp" ).click((event) => {
        if (sort_asc) sort_asc = false;
        else sort_asc = true;
        updateList("temp", current_city);

        $( ".temp_img" ).css("background", "url(/images/select.png) no-repeat 95% center")
            .css("background-size", "20px 20px");

        if (sort_asc) $( ".temp_img" ).attr("flipped", "flipped");
        else $( ".temp_img" ).removeAttr("flipped");

        $( ".date_img" ).css("background", "none");
        $( ".city_img" ).css("background", "none");
    });

    $( ".data_header_date" ).click((event) => {
        if (sort_asc) sort_asc = false;
        else sort_asc = true;
        updateList("date", current_city);

        $( ".date_img" ).css("background", "url(/images/select.png) no-repeat 95% center")
            .css("background-size", "20px 20px");

        if (sort_asc) $( ".date_img" ).attr("flipped", "flipped");
        else $( ".date_img" ).removeAttr("flipped");

        $( ".temp_img" ).css("background", "none");
        $( ".city_img" ).css("background", "none");
    });

    $( ".data_header_city" ).click((event) => {
        if (sort_asc) sort_asc = false;
        else sort_asc = true;
        updateList("city", current_city);

        $( ".city_img" ).css("background", "url(/images/select.png) no-repeat 95% center")
            .css("background-size", "20px 20px");

        if (!sort_asc) $( ".city_img" ).attr("flipped", "flipped");
        else $( ".city_img" ).removeAttr("flipped");

        $( ".temp_img" ).css("background", "none");
        $( ".date_img" ).css("background", "none");
    });
}


/**
 *  Handles data insertion/deletion locally
 * @param json          {json} Data that will be inserted/deleted
 * @param location      {string} City's id. Tells which city's temperature will be added or removed.
 * @param addOrRemove   {string} Command. Tells if data will be added or deleted.
 */
function handleLocal(json, location, addOrRemove) {
    json = JSON.parse(json);

    if (addOrRemove === "add") {
        getCitybyID(location)['weather'].push(json);
    } else if (addOrRemove === "remove") {
        for (let i = 0; i < data.cities.length; i++) {
            if (location === data.cities[i].id) {
                for (let j = 0; j < data.cities[i].weather.length; j++) {
                    if (data.cities[i].weather[j].date === json.date &&
                        data.cities[i].weather[j].temp === json.temp) {
                            data.cities[i].weather.splice(j, 1);
                            break;
                    }
                }
                break;
            }
        }
    }

    update(location);
    updateList(sortType, current_city);
}


/**
 * Creates commandline for server
 * @param dataSend {json/text} Data, that will be sent
 * @param location {string} City's id, which temperature will be sent.
 * @param addOrRemove {string} "add" or "remove", determines the command
 */
function handleServer(dataSend, location, addOrRemove) {
    serverQueue.push(addOrRemove + "|" + location + "|" + dataSend);
    serverSend();
}

/**
 * Actual sending funtion. Creates recursive loop to go through the server's queue.
 */
function serverSend() {
    if (serverReady && serverQueue.length !== 0) {
        serverReady = false;
        $.post("weather.json", serverQueue.pop(), (dataReceive, status) => {
            console.log("Data: " + dataReceive + "\nStatus: " + status);
            serverReady = true;
            if (serverQueue.length !== 0) serverSend();
        });
    }
}


/**
 * Updates the temperature list by:
 *  - Adding wanted temperatures and dates to array
 *  - Sorts the array as user wants
 *  - Creates the DOM-elements.
 *
 * @param sort {string} Values: ["temp", "city", "date"] Determines, how data will be sorted.
 * @param cityID {string} City's id, which temperatures user wants to list.
 */
function updateList(sort, cityID) {

    // Updates the global variable, so we know what is the current sorting type.
    // (In case we want to reload the list and maintain the same sorting.)
    sortType = sort;

    let weather = [];

    if (cityID === '') {
        let cityName;
        data.cities.map((city) => {
            cityName = city.id;
            city.weather.map((temp) => {
                weather.push([
                    temp.temp,
                    temp.date,
                    cityName]);
            });
        });
    } else {
        current_city = cityID;
        for (let i = 0; i < data.cities.length; i++) {
            if (data.cities[i].id === cityID) {
                cityName = data.cities[i].name;
                for (let j = 0; j < data.cities[i].weather.length; j++) {
                    weather.push([
                        data.cities[i].weather[j].temp,
                        data.cities[i].weather[j].date,
                        data.cities[i].id]);
                }
                break;
            }
        }
    }

    $( ".data_list").empty();

    switch (sort) {
        case "temp": {
            weather.sort((a, b) => {
                let tempA = parseInt(a[0]);
                let tempB = parseInt(b[0]);
                if (sort_asc) {
                    if (tempA < tempB) return -1;
                    if (tempA > tempB) return 1;
                } else {
                    if (tempA < tempB) return 1;
                    if (tempA > tempB) return -1;
                }
                return 0;
            });
        } break;
        case "date": {
            weather.sort((a, b) => {
                let dateA = new Date(a[1]);
                let dateB = new Date(b[1]);
                return sort_asc ? dateA - dateB : dateB - dateA;
            });
        } break;
        case "city": {
            weather.sort((a, b) => {
                if (sort_asc) {
                    if (a[2] < b[2]) return -1;
                    if (a[2] > b[2]) return 1;
                } else {
                    if (a[2] < b[2]) return 1;
                    if (a[2] > b[2]) return -1;
                }
                return 0;
            });
        } break;
    }


    // Count lets us to create ID's automatically.
    let count = 0;

    weather.map((temp) => {
        if (count % 2 === 0) {
            $( "<li id='data_row" + count + "' class='odd'></li>" ).appendTo(".data_list");
        } else {
            $( "<li id='data_row" + count + "' class='even'></li>" ).appendTo(".data_list");
        }

        $( "<p class='data_row_temp'>" + fix(checkUnit(temp[0])) + "</p>").appendTo("#data_row" + count);

        let date = temp[1].slice(4, 24);

        $( "<p class='data_row_date'>" + date + "</p>").appendTo("#data_row" + count);
        $( "<p class='data_row_city'>" + getCitybyID(temp[2]).name + "</p>").appendTo("#data_row" + count);

        $( "<div class='data_row_del' id='data_del" + count + "'>" +
                "<svg height='26' width='26'>" +
                    "<line x1='5' y1='5' x2='21' y2='21' style='stroke:black; stroke-width:2'/>" +
                    "<line x1='21' y1='5' x2='5' y2='21' style='stroke:black; stroke-width:2'/>" +
                "</svg>" +
            "</div>").appendTo("#data_row" + count);



        // Adds the deletion click-event
        $( "#data_del" + count ).click((event) => {
            let data =
                '              {\n' +
                '                "temp": "' + temp[0] + '",\n' +
                '                "date": "' + temp[1] + '"\n' +
                '              }\n';

            handleLocal(data, temp[2], "remove");
            handleServer(data, temp[2], "remove");
        });

        count++;
    });

    // Changes the list's name.
    if (current_city === '') $( ".data_name" ).text("Weather from every city");
    else $( ".data_name" ).text("Weather from " + getCitybyID(current_city).name);
}


/**
 * Updates the given city's weather to UI.
 * @param id {string} City id, which weather will be updated.
 */
function update(id) {
    $( "#" + id + "_current" ).text(fix(checkUnit(getCurrent(id))));
    $( "#" + id + "_highest" ).text(fix(checkUnit(getHighest(id))));
    $( "#" + id + "_lowest" ).text(fix(checkUnit(getLowest(id))));
}


//**************** UTILITY FUNCTIONS **************************

/**
 * Checks if given input is a number.
 * @param temp {num/text} User input.
 * @returns {boolean} true if input is valid, false if not.
 */
function validInput(temp) {
    if (isNaN(temp) || temp.length === 0 ) return false;
    return true;
}


/**
 * Gets city-element from JSON by city's name
 * @param name {string} City's name, which data will be returned.
 * @returns {*} {json-element} City-element from json-file.
 */
function getCitybyName(name) {
    for (let i = 0; i < data.cities.length; i++) {
        if (data.cities[i].name === name) return data.cities[i];
    }
}


/**
 * Gets city-element from JSON by city's id
 * @param id {string} City's id, which data will be returned.
 * @returns {*} {json-element} City-element from json-file.
 */
function getCitybyID(id) {
    for (let i = 0; i < data.cities.length; i++) {
        if (data.cities[i].id === id) return data.cities[i];
    }
}


/**
 * Calculates coordinates in degree -format.
 * @param city {json} Given city
 * @returns {string} Coordinates in degrees.
 */
function getCoordinates(city) {
    let latDec = city.lat;
    let lonDec = city.lon;
    let coord = '';
    coord += Math.abs(Math.floor(latDec)) + String.fromCharCode(176);
    coord += Math.abs(Math.floor((latDec * 60) % 60)) + '\'';
    coord += (Math.abs(Math.floor((latDec * 3600) % 3600))) + '\"';
    latDec >= 0 ? coord += "N " : coord += "S ";

    coord += Math.abs(Math.floor(lonDec)) + String.fromCharCode(176);
    coord += Math.abs(Math.floor((lonDec * 60) % 60)) + '\'';
    coord += (Math.abs(Math.floor((lonDec * 3600) % 3600))) + '\"';
    lonDec >= 0 ? coord += 'E' : coord += 'W';

    return coord;
}


/**
 * Return city's most recent temperature.
 * @param id {string} City's id, which data will be returned.
 * @returns {string} Most recent temperature from given city
 */
function getCurrent(id) {
    for (let i in data.cities) {
        let city = data.cities[i];
        if (city.id === id) {
            if (city.weather === undefined || city.weather.length === 0) return "--";
            return city.weather[city.weather.length - 1].temp;
        }
    }
}


/**
 * Returns lowest temperature of the given city.
 * @param id {string} City's id, which data will be returned.
 * @returns {*} Lowest temperature in the last 24 hours from given city.
 */
function getLowest(id) {
    for (let i in data.cities) {
        let city = data.cities[i];
        if (city.id === id) {
            if (city.weather === undefined || city.weather.length === 0) return "--";
            let lowest = city.weather[0].temp;
            city.weather.map((temp) => {
                if (checkTimeFromToday(temp.date) &&
                    parseFloat(temp.temp) < lowest) lowest = temp.temp;
            });
            return lowest;
        }
    }
}


/**
 * Returns highest temperature of the given city.
 * @param id {string} City's id, which data will be returned.
 * @returns {*} highest temperature in the last 24 hours from given city.
 */
function getHighest(id) {
    for (let i in data.cities) {
        let city = data.cities[i];
        if (city.id === id) {
            if (city.weather === undefined || city.weather.length === 0) return "--";
            let highest = city.weather[0].temp;
            city.weather.map((temp) => {
                if (checkTimeFromToday(temp.date) &&
                    parseFloat(temp.temp) > highest) highest = temp.temp;
            });
            return highest;
        }
    }
}


/**
 * Checks if given date is over 24 hours from current time.
 * @param date {date/string} Given date.
 * @returns {boolean} True if date is less than 24 hours from current time, false if not.
 */
function checkTimeFromToday(date) {
    date = new Date(date);
    if ((Date.now() - date.getTime()) < 86400000) return true; // 24 hours is 86 400 000 milliseconds
    return false;
}


/**
 * Checks which units the User is using.
 * Currently relies on fact that every temperature is been saved in Celsius.
 * This needs to be changed, if we start saving temperatures in their original units.
 * @param temp {number/string} Temperature that will be checked.
 * @returns {string} Correct temperature.
 */
function checkUnit (temp) {
    if (isNaN(temp)) return "--";
    if (unitC) return temp.toString();
    return CtoF(temp).toString();
}


/**
 * Fixes decimals. (No rounding)
 * @param num {string} Number in bad format (with dozen decimals)
 * @returns {*} Number in good format (with one decimal)
 */
function fix(num) {
    if (isNaN(num)) return num;
    if (num.indexOf('.') < 0) return num + ".0";
    return num.toString().slice(0, (num.indexOf('.') + 2));
}

// Converts temperature from Celsius to Fahrenheit
function CtoF(C) {
    return (C * 1.8 + 32);
}

// Converts temperature from Fahrenheit to Celsius
function FtoC(F) {
    return (F - 32) / 1.8;
}


