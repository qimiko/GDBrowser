const request = require('request');
const util = require('util');
const XOR = require('../../classes/XOR.js');
const xor = new XOR();
const crypto = require('crypto')
function sha1(data) { return crypto.createHash("sha1").update(data, "binary").digest("hex"); }

let rateLimit = {};
let cooldown = 150  // GD has a secret rate limit and doesn't alert you when a comment is rejected, so I'm doing the honors

function getTime(time) {
  let seconds = Math.ceil(time / 1000);
  seconds = seconds % 60;
  return seconds}

module.exports = async (app, req, res) => {

  if (!req.body.comment) return res.status(400).send("No comment provided!")
  if (!req.body.username) return res.status(400).send("No username provided!")
  if (!req.body.levelID) return res.status(400).send("No level ID provided!")
  if (!req.body.accountID) return res.status(400).send("No account ID provided!")
  if (!req.body.password) return res.status(400).send("No password provided!")

  if (req.body.comment.includes('\n')) return res.status(400).send("Comments cannot contain line breaks!")

  if (rateLimit[req.body.username]) return res.status(400).send(`Please wait ${getTime(rateLimit[req.body.username] + cooldown - Date.now())} seconds before posting another comment!`)

  // authenticationt
  const postPromise = util.promisify(request.post);

  try {
    const resp = await postPromise(app.endpoint + "api/login", {
      form: {
        username: req.body.username,
        password: req.body.password
      },
      json: true
    });
    if (!resp.body.success) {
      return res.status(400).send("bad pass");
    }
  } catch (err) {
    return res.status(400).send("that shouldn't happen");
  }

  let params = {
    gameVersion: app.gameVersion,
    binaryVersion: app.binaryVersion,
    secret: app.secret,
    percent: 0
  }

  params.comment = Buffer.from(req.body.comment)
  params.gjp = ""
  params.levelID = req.body.levelID.toString()
  params.accountID = req.body.accountID.toString()
  params.userName = req.body.username

  let percent = 0
  if (percent && percent > 0 && percent <= 100) params.percent = percent.toString()

  request.post(app.endpoint + 'uploadGJComment19.php', {
    form: params,
    headers: {'x-forwarded-for': req.headers['x-real-ip']} // prevent pesky ip bans
  }, function (err, resp, body) {
    if (err) return res.status(400).send("The Geometry Dash servers returned an error! Perhaps they're down for maintenance")
    if (!body || body == "-1") return res.status(400).send("The Geometry Dash servers rejected your comment! Try again later, or make sure your username and password are entered correctly.")
    if (body.startsWith("temp")) {
      let banStuff = body.split("_")
      return res.status(400).send(`You have been banned from commenting for ${(parseInt(banStuff[1]) / 86400).toFixed(0)} days. Reason: ${banStuff[2] || "None"}`)
    }
    res.status(200).send(`Comment posted to level ${params.levelID} with ID ${body}`)
    rateLimit[req.body.username] = Date.now();
    setTimeout(() => {delete rateLimit[req.body.username]; }, cooldown);
  })
}