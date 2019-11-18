const request = require('request')

module.exports = async (app, req, res) => {

    let params = {
        userID : req.params.id, 
        accountID : req.params.id, 
        levelID: req.params.id,
        page: req.query.page || 0,
        mode: req.query.hasOwnProperty("top") ? "1" : "0",
        gameVersion: 21,
        binaryVersion: 33,
    }  

    let path = "getGJComments"
    if (req.query.type == "profile") path = "incl/comments/getGJAccountComments"

    request.post(`https://absolllute.com/gdps/gdapi/${path}.php`, {
    form : params}, async function(err, resp, body) { 
      if (err || body == '-1' || body == '-2' || !body) return res.send("-1")

      comments = body.split('|')
      comments = comments.map(x => x.split(':'))
      comments = comments.map(x => x.map(x => app.parseResponse(x, "~")))
      if (req.query.type == "profile") comments.filter(x => x[0][2])
      else comments = comments.filter(x => x[1][1])
      if (!comments.length) return res.send("-1")

      let commentArray = []

      comments.forEach(c => {

        var x = c[0] //comment info
        var y = c[1] //account info

        if (!x[2]) return;

        let comment = {}
        comment.content = app.clean(Buffer.from(x[2], 'base64').toString());
        comment.ID = x[6]
        comment.likes = x[4]
        comment.date = (x[9] || "?") + " ago"
        if (req.query.type == "commentHistory") comment.levelID = x[1]
        if (req.query.type != "profile") {
          comment.username = y[1] || "Unknown"
          comment.playerID = x[3]
          comment.accountID = y[16]
          comment.form = ['icon', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'][Number(y[14])]
          if (x[10] > 0) comment.percent = x[10]
          if (comment.content.startsWith('&#60;cg&#62;')) {
            comment.modColor = true;
            comment.content = comment.content.replace('&#60;cg&#62;', '').replace('&#60;/c&#62;', '');
          }
        }
        commentArray.push(comment)
      }) 

      return res.send(commentArray)

      })
}