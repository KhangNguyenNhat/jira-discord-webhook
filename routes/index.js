var express = require('express');
var router = express.Router();
var discord = require('discord-bot-webhook');
var yaml = require('js-yaml');
var fs   = require('fs');
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(403).end()
});

/* GET webhook page. */
router.post('/:hookId/:hookToken', function(req, res, next) {
    discord.hookId = req.params.hookId;
    discord.hookToken = req.params.hookToken;

    var webhookEvent = req.body.webhookEvent.startsWith("comment_") === true ? req.body.webhookEvent : req.body.webhookEvent.split(':')[1]
    var issue = req.body.issue;
    var user = webhookEvent.startsWith("comment_") === true ? req.body.comment.author : req.body.user
    var commentBody = webhookEvent.startsWith("comment_") === true ? req.body.comment.body : ""

    var matches = issue.self.match(/^(https?:\/\/[^\/?#]+)(?:[\/?#]|$)/i);
    var domain = matches && matches[1];

    discord.userName = 'JiraWebhook';
    discord.avatarUrl = 'https://seeklogo.com/images/A/atlassian-logo-73142F0575-seeklogo.com.gif';

    if (webhookEvent.startsWith("issue_") === true) {
      var epicLink = issue.fields.customfield_10008
      var labels = issue.fields.labels.toString()
      var fixVersions = ''
      Object.keys(issue.fields.fixVersions).forEach(function(key) {
        var val = issue.fields.fixVersions[key];
        fixVersions += val.name + ', '
      });

      var components = ''
      Object.keys(issue.fields.components).forEach(function(key) {
        var val = issue.fields.components[key];
        components += val.name + ', '
      });

      var attachment = ''
      Object.keys(issue.fields.attachment).forEach(function(key) {
        var val = issue.fields.attachment[key];
        attachment += val.filename + ', '
      });
    }

    try {
        var actionsMessages = yaml.safeLoad(fs.readFileSync(path.join(appRoot,'messages_templates.yml'), 'utf8'));
    } catch (e) {
        console.log(e);
      return res.status(500).end()
    }

    if (actionsMessages[webhookEvent]) {
        var actionMessage = actionsMessages[webhookEvent];
        var regex = /({{)([\\.a-zA-Z0-9]+)(}})/g;
        var message = actionMessage.replace(regex, function(match, text, urlId) {
            return eval(urlId);
        });
        discord.sendMessage(message);
    }

    res.end();
});

module.exports = router;
