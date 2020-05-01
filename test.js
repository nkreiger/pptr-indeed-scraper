const { format } = require('date-fns');
const fs = require('fs');
const XLSX = require('xlsx');

let fileName = format(new Date(), 'MM-dd-yyyy-k:mm:ss') + '_input_location' + '.xlsx';

fs.writeFileSync(`./output/${fileName}`);

const formatToExcel = (result) => {
    let formatted = Object.keys(result).map((key) => {
        return {
            company: key,
            count: result[key].count,
            postings: JSON.stringify(result[key].postings)
        }
    });
   return formatted;
};

let companyResults =
    {
        google: {
            count: 8,
            postings: [
                {
                    title: "software engineer",
                    rating: "3.7",
                    summary: "this is a cool job!"
                }
            ]
        },
        facebook: {
            count: 10,
            postings: [
                {
                    title: "software engineer",
                    rating: "3.7",
                    summary: "this is a cool job!"
                }
            ]
        }
    }



let data = [
    {"name":"John, The Man", "city": "Seattle"},
    {"name":"Mike", "city": "Los Angeles"},
    {"name":"Zach", "city": "New York"}
];

let ws = XLSX.utils.json_to_sheet(formatToExcel(companyResults));

// ws = XLSX.utils.json_to_sheet([
//     { A: "S", B: "h", C: "e", D: "e", E: "t", F: "J", G: "S" }
// ], {header: ["A", "B", "C", "D", "E", "F", "G"], skipHeader: true});

let wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test");

console.log(fileName);
console.log(ws);
try {
    XLSX.writeFile(wb, `./output/${fileName}`);
} catch (err) {
    console.log(err);
}
