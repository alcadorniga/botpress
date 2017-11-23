var csv = require("fast-csv");
var fs = require("fs");
var _ = require("underscore");

/**
 * CsvHelper - the helper for the fast-csv library
 * we will use this to read from and write to the CSV file
 */
function CsvHelper() {
    //// empty constructor
}

/**
 * writeMessage - writes the new message
 * @param  {Object} model - data where encrypted text, AES key, and IV located.
 * @return {Object} result - the resulting model
 */
CsvHelper.prototype.writeMessage = function(message) {
    var readableStream = fs.createReadStream("../../temp/conversations.csv");
    var csvData = [];
    csv
        .fromStream(readableStream, { headers: true })
        .on("data", function(data) {
            csvData.push(data);
        })
        .on("end", function() {
            var lastID = _.last(csvData).id;
            var messageID = parseInt(lastID) + 1;
            csvData.push({ id: messageID, message: message });
            var writeableStream = fs.createWriteStream("../../temp/conversations.csv");
            csv.write(csvData, { headers: true }).pipe(writeableStream);
        });
}

module.exports = new CsvHelper();