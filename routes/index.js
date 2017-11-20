var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var fetch = require('isomorphic-fetch');
var authenticate = require('../helpers/middleware').authenticate;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Steem Faucet Admin' });
});

router.get('/user/:id', function(req, res, next) {
  req.db.users.findOne({
    where: { id: req.params.id }
  }).then(
    function(user) {
      res.render('user', {
        title: 'User details',
        user
      });
    }
  );
});

router.get('/users/pending', authenticate(), function (req, res, next) {
  var page = parseInt(req.query.page) || 1;

  req.db.users.findAll({
    order: [['updated_at', 'DESC']],
    offset: parseInt((page - 1) * 25),
    limit: 25,
    where: { status: 'manual_review' }
  }).then(
    function(users) {
      res.render('pending-users', {
        page: page,
        title: 'Pending approval users',
        users: users,
      });
    }
  );
});

router.get('/users/all', authenticate(), function (req, res, next) {
  var page = parseInt(req.query.page) || 1;

  req.db.users.findAll(
    {
      order: [['updated_at', 'DESC']],
      offset: parseInt((page - 1) * 25),
      limit: 25,
    }
  ).then(
    function(users) {
      res.render('all-users', {
        page: page,
        title: 'All users',
        users: users
      });
    }
  );
});

router.post('/approve', authenticate(), function (req, res, next) {
  req.db.users.update({
    status: 'approved',
  }, { where: { id: req.body.id } });

  req.db.users.findOne({ where: { id: req.body.id } })
    .then(
      function(user) {
        const token = jwt.sign({
          email: user.email,
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        fetch(`${process.env.FAUCET_URL}/api/approve_account?token=${token}`)
          .then(function(response) {
            return response.json();
          })
          .then(function(result) {
            res.json({ success: result.success });
          });
      }
    );
});

router.post('/reject', authenticate(), function (req, res, next) {
  req.db.users.update({
    status: 'rejected',
  }, { where: { id: req.body.id } });
  res.json({ success: true });
});

router.get('/authenticated', function(req, res, next) {
  res.render('authenticated', {
    title: 'Authenticated'
  });
});

router.get('/unauthorized', function(req, res, next) {
  res.render('unauthorized', {
    title: 'Authorized'
  });
});

module.exports = router;
