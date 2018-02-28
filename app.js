//******************************************************************
//              -*- Weather app (SERVER) -*-
//    for Reaktor's summerjob application
//
//      @author: Toni Tiainen
//      @version: 27.2.2018
//
// Few words: This application uses JSON-file as a database.
//
//******************************************************************


//  Required npm-libraries:
const http = require("http");
const fs = require('fs');

// Loads the json - file
const filename = "./data/weathers.json";
let json = require(filename);

const port = 3000;

/**
 * Creates http-server that handles GET and POST commands.
 *
 */
const server = http.createServer((req, res) => {
    if (req.method.toLocaleLowerCase() === 'get') {
        if (req.url === '/') {
            init(req, res);
        } else {
            let type = req.url.split('.')[1];
            switch (type) {
                case 'css':
                    load(req, res, '.' + req.url, 'text/css');
                    break;
                case 'js':
                    load(req, res, '.' + req.url, 'text/javascript');
                    break;
                case 'json':
                    load(req, res, './data/weathers.json', 'application/json');
                    break;
                case 'png':
                    load(req, res, '.' + req.url, 'image/png');
                    break;
                default:
                    console.log("Unknown file format: " + type);
            }
        }
    } else if (req.method.toLocaleLowerCase() === 'post') {
        let body = '';

        req.on('data', (data) => {
            body += data;
        });

        req.on('end', () => {
            let data = body.split('|');

            if (data[0] == "add") saveData(JSON.parse(data[2]), data[1]);
            else if (data[0] == "remove") removeData(JSON.parse(data[2]), data[1]);
            else console.log("Unknown command: " + data[0]);
        });

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('Data received.');

    }
}).listen(port, () => {
    console.log("Server running at localhost:3000");
});


/**
 * Loads file from given directory (url).
 * @param req Request: Received http-package.
 * @param res Respond: http-package, that will be sent back.
 * @param filename URL to wanted file.
 * @param type File type that is needed when sending data back to client.
 */
function load (req, res, filename, type) {
    if (req.method.toLocaleLowerCase() === "get") {
        res.statusCode = 200;
        res.setHeader('Content-Type', type);
        let file = fs.readFileSync(filename);
        res.write(file);
        res.end();
    }
    console.log("Loaded: " + filename);
}

/**
 * Sends html-file to client.
 * @param req Request: Received http-package.
 * @param res Respond: http-package, that will be sent back.
 */
function init(req, res) {
    load(req, res, './index.html', 'html');
}


/**
 * Handles server side saving:
 * Makes changes to local json-file, and then rewrites it to server's memory.
 * @param data {json} Data that will be inserted.
 * @param location {string} City's id, which temperature is added.
 */
function saveData(data, location) {
    json.cities.map((city) => {
        if (city.id == location) {
            city.weather.push(data);
        }
    });

    fs.writeFile(filename, JSON.stringify(json, null, 2), (err) => {
        if (err) return console.log(err);
        console.log("Writing to: " + filename);
    });
}


/**
 * Handles server side deletion.
 * @param data {json} Data that needs to be removed.
 * @param location {string} City's id, which temperatures will be removed.
 */
function removeData(data, location) {
    for (let i = 0; i < json.cities.length; i++) {
        if (location == json.cities[i].id) {
            for (let j = 0; j < json.cities[i].weather.length; j++) {
                if (json.cities[i].weather[j].date == data.date &&
                    json.cities[i].weather[j].temp == data.temp) {

                    // Using splice, because "delete" -command leaves an unwanted empty branch.
                    json.cities[i].weather.splice(j, 1);
                    break;
                }
            }
            break;
        }
    }

    fs.writeFile(filename, JSON.stringify(json, null, 2), (err) => {
        if (err) return console.log(err);
        console.log("Deleting from: " + filename);
    });
}


