var express = require('express');
var router = express.Router();
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'client', 'build')));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname , 'client', 'build' , 'index.html'));
});

module.exports = router;
