const fs = require('fs');

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

module.exports.load = load;