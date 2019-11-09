const request = require('request')

module.exports = async (app, req, res) => {

  let server = req.body.server
  request.post('http://' + server + '/database/getGJLevels21.php', {form : {secret: 'Wmfd2893gb7'}}, function (err, resp, body) {
    console.log(body)
  let valid = !!body && (body.startsWith("1:") || body.startsWith("##") || body.split(":").length > 10)
  if (valid) res.cookie('server', server, { maxAge: 420694206942069 });
  return res.send({valid})

  })
}