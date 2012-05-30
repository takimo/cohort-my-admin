
/*
 * GET home page.
 */

// brook
var brook = require('../lib/brook-nodejs.js');
var promise = brook.promise;
// zepto
var domino = require('domino');
var Zepto = require('zepto-node');
var window = domino.createWindow();
var $ = Zepto(window);

// db
var cohortDB = require('dirty')('./data/cohort.db');
var dbs = {};
cohortDB.on("load", function(){
  cohortDB.forEach(function(key, value){
    dbs[key] = require('dirty')('./data/' + key + '.db');
  });
});

var getCohorts = function(){
  var items = [];
  cohortDB.forEach(function(key, val){
    items.push(key);
  });
  return items;
};

var loadAllData = promise()
  .bind(function(next, value){
    var cohorts = [];
    dbs[value].forEach(function(key, val){
      cohorts.push(key);
    });
    next(cohorts);
  });

exports.index = function(req, res){
  res.redirect('/cohort/');
};

exports.cohort_index = function(req, res){
  var items = [];
  cohortDB.forEach(function(key, val){
    items.push({
      id: key,
      title: val.title,
      data: val
    });
  });
  res.render('cohort/index', {
    title: 'Express',
    cohorts: getCohorts(),
    cohortData: items,
    id: null
  });
};

exports.cohort_create = function(req, res){
  if(!req.body.id){
    return res.render('cohort/create', {
      title: 'Express',
      cohorts: getCohorts(),
      id: null
    });
  }
  cohortDB.set(req.body.id, {
    title: req.body.title,
    acquisition: req.body.acquisition,
    activation: req.body.activation,
    retention: req.body.retention,
    revenue: req.body.revenue,
    referral: req.body.referral
  }, function(){
    var db = require('dirty')('./data/' + req.body.id + '.db');
    db.on('load', function(){
      dbs[req.body.id] = db;
      res.redirect('/cohort/' + req.body.id);
    });
  });
};

exports.cohort_fill = function(req, res){
  if(!req.body.data){
    return res.render('cohort/fill', {
      title: 'Express',
      id: req.params.id
    });
  }
  var date = new Date('2012/01/01');
  var targetDate = function(){
    return date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
  };
  for(var i=0;i<365;i++){
    dbs[req.body.id].set(targetDate(), req.body.data, function(){
      console.log("save");
    });
    date.setTime(date.getTime() + 86400000);
  }
  res.send('filled!');
};

var getDay = function(date){
  return (date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2));
}
exports.cohort_view = function(req, res){
  var date = new Date();
  var today = getDay(date);
  var targetDay = (req.params.date) ? req.params.date : today;
  var targetDate = new Date(targetDay.slice(0,4) + "/" + targetDay.slice(4,6) + "/" + targetDay.slice(6,8));

  var nextDate = new Date(targetDate.getTime() + 86400000);
  var previousDate = new Date(targetDate.getTime() - 86400000);
  var nextDay = getDay(nextDate);
  var previousDay = getDay(previousDate);

  var jsonString = dbs[req.params.id].get(targetDay);
  var chartData = [];
  if(jsonString){
    var json = JSON.parse(jsonString);
    chartData = json.map(function(data){
      var activation = parseFloat(String((data.activation / data.acquisition)).slice(0,6) * 100);
      var retention = parseFloat(String((data.retention / data.acquisition)).slice(0,6) * 100);
      var revenue = parseFloat(String((data.revenue / data.acquisition)).slice(0,6) * 100);
      var referral = parseFloat(String((data.referral / data.acquisition)).slice(0,6) * 100);
      activation = activation - retention;
      retention = retention - revenue;
      revenue = revenue - referral;
      var acquisition = 100 - (activation + retention + revenue + referral);

      return {
        date: data.date,
        acquisition: acquisition,
        activation: activation,
        retention: retention,
        revenue: revenue,
        referral: referral
      };
    });
  }
  var cohortData = cohortDB.get(req.params.id);
  res.render('cohort/view', {
    title: 'Express',
    cohorts: getCohorts(),
    id: req.params.id,
    today: targetDay,
    nextDay: nextDay,
    previousDay: previousDay,
    json: JSON.stringify(chartData),
    rawData: jsonString,
    cohortData: cohortData
  });
};

exports.cohort_add = function(req, res){
  var date = new Date();
  var today = (date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2));
  if(req.body.date){
    var json;
    try{
      json = JSON.parse(req.body.data);
    }catch(e){
      return res.render('cohort/add', {
        title: 'Express',
        cohorts: getCohorts(),
        id: req.params.id,
        today: today,
        error: "can't parse JSON"
      });
    }
    dbs[req.params.id].set(req.body.date, req.body.data, function(){
      res.redirect('/cohort/' + req.params.id + "/" + req.body.date);
    });
  }else{
    res.render('cohort/add', {
      title: 'Express',
      cohorts: getCohorts(),
      id: req.params.id,
      today: today,
      error: ""
    });
  }
};
