const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const csv = require("fast-csv");
const _ = require("lodash");
const moment = require("moment");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "tmp/csv/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

let upload = multer({ storage: storage }).single("file");

router.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }
    const fileRows = [];
    let ids = [];
    if (req.body.ids) {
      ids = req.body.ids.split(",");
    }

    function resolver() {
      return new Promise((resolve, reject) => {
        csv
          .parseFile(req.file.path)
          .on("data", function (data) {
            if (!ids.includes(data[0])) {
              fileRows.push({
                id: data[0],
                name: data[1],
                department: data[2],
                time: data[3],
                attendanceStatus: data[4],
                attendanceCheckPoint: data[5],
                dataSource: data[6],
                handlingType: data[7],
              });
            }
          })
          .on("end", function () {
            resolve(fileRows);
            fs.unlinkSync(req.file.path);
          });
      });
    }

    (async () => {
      const data = await resolver();
      const result = [];
      let uniqueIds = [];

      for (let i = 1; i < data.length; i++) {
        if (!uniqueIds.includes(data[i].id)) {
          uniqueIds.push(data[i].id);
        }
      }

      uniqueIds.forEach((id) => {
        let tempArray = [];
        data.forEach((elem) => {
          if (elem.id === id) {
            tempArray.push(elem);
          }
        });

        tempArray.sort((a, b) => a.time.localeCompare(b.time));
        result.push(...tempArray);
      });

      return res.json({ result });
    })();
  });
});

router.post("/calculate", (req, res) => {
  let data = req.body.data;
  let uniqueIds = [];
  let result = [];

  for (let i = 1; i < data.length; i++) {
    if (!uniqueIds.includes(data[i].id)) {
      uniqueIds.push(data[i].id);
      result.push({
        id: data[i].id,
        name: data[i].name,
      });
    }
  }

  for (let i = 0; i < uniqueIds.length; i++) {
    let enteredDate = 0;
    let exitDate = 0;
    let totalHours = 0;
    let totalMinutes = 0;
    let userData = [];

    data.forEach((elem) => {
      if (uniqueIds[i] === elem.id) {
        userData.push(elem);
      }
    });

    let sortedUserData = userData.sort((a, b) => a.time.localeCompare(b.time));

    sortedUserData.forEach((user) => {
      if (user && user.withTimeInput) {
        user.time =
          moment(user.dateInputValue).format("YYYY-MM-DD") +
          " " +
          user.timeInputValue;
      }
      if (
        user &&
        user.id === uniqueIds[i] &&
        user.attendanceCheckPoint === "Entrance_Entrance_Entrance Card Reader1"
      ) {
        enteredDate = moment(user.time, "YYYY-MM-DD HH:mm:ss");
      }

      if (
        user &&
        user.id === uniqueIds[i] &&
        user.attendanceCheckPoint === "Exit_Exit_Entrance Card Reader1"
      ) {
        exitDate = moment(user.time, "YYYY-MM-DD HH:mm:ss");
      }

      if (exitDate && enteredDate) {
        const diff = exitDate.diff(enteredDate);
        const diffDuration = moment.duration(diff);

        totalHours += diffDuration.hours();
        totalMinutes += diffDuration.minutes();

        exitDate = 0;
        enteredDate = 0;
      }
    });

    if (totalMinutes >= 60) {
      result[i].totalWorkingTime = `hours ${
        totalHours + Math.floor(totalMinutes / 60)
      } : minutes ${totalMinutes % 60}`;
    } else {
      result[
        i
      ].totalWorkingTime = `hours ${totalHours} : minutes ${totalMinutes}`;
    }
  }
  return res.send({ result });
});

module.exports = router;
