const express = require('express');
const axios = require('axios');
const cors = require('cors');

const helper = require('./helper');

const app = express();

// key for delegator API at https://uploadbeta.com/api/steemit/delegators must be set
if (!process.env.DELEGATORS_API_KEY) {
  console.log('Missing env var: DELEGATORS_API_KEY');
  process.exit();
}

// all the frog accounts
const accounts = ['the-magic-frog', 'der-zauberfrosch', 'grenouille'];

// allow cross origin resource sharing
app.use(cors());

// get delegators for one of the frog accounts
app.get('/delegators', (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    axios.get('https://uploadbeta.com/api/steemit/delegators/?cached&hash=' + process.env.DELEGATORS_API_KEY + '&id=' + account).then((result) => {
      let delegators = result.data;
      // sort by SP
      delegators.sort((a, b) => {
        return a.sp < b.sp;
      });

      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(delegators);
    }).catch((err) => {
      console.error(err);
      next();
    });
  }
});

// get all contributors for one of the frog accounts
app.get('/contributors', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);
    const allCommands = helper.getAllCommands(stories);
    const contributors = helper.getContributors(allCommands);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(contributors);
  }
});

// get all stories (the last post of each story)
app.get('/stories', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(stories);
  }
});

// get all commands from current story post
app.get('/submissions', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const submissions = await helper.getSubmissions(allStoryPosts[allStoryPosts.length - 1]);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(submissions);
  }
});

// get all story posts
app.get('/storyposts', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    allStoryPosts.reverse();

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(allStoryPosts);
  }
});

// get account data
app.get('/account', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const accountData = await helper.getAccount(account);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(accountData);
  }
});

// get pot size
app.get('/pot', async (req, res, next) => {
  const account = req.query.account;
  let storyNumber = parseInt(req.query.storyNumber);

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);

    // validate storyNumber, fallback to latest
    storyNumber = storyNumber && storyNumber <= stories.length ? storyNumber : stories.length;

    const storyPosts = helper.getStoryPosts(allStoryPosts, storyNumber);
    const pot = helper.getPot(storyPosts);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(pot);
  }
});

// Hey! Listen! https://www.youtube.com/watch?v=95mmGO3sleE
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log('API listening on port ' + PORT + '!');
});