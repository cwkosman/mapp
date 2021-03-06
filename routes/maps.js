"use strict";

const express = require('express');
const router = express.Router();


const thumbnail = require("../lib/thumbnail.js");

module.exports = (knex) => {

  // GET METHODS

  const mapsLists = [
    {name: "All", query: "all"},
    {name: "Favorites", query: "favs"},
    {name: "Contributed", query: "contrib"},
    {name: "Created", query: "user"}
  ];
  //GEt METHOD FOR /MAPS
  router.get('/', (req, res) => {
    let currentList = 'All';
    //TODO: pagination
    // let perPage = 12;
    let selectMaps = knex
      .select('*')
      .from('maps');
    //Query for user maps
    if (req.query.show === 'user') {
      currentList = 'Created';
      selectMaps = knex
      .select('*')
      .from('maps')
      .where({
        user_id: req.session.user_id
      });
    }
    //Query for user favorite maps
    if (req.query.show === 'favs') {
      selectMaps = knex('favorites')
      .select('maps.id', 'maps.title')
      .join('maps', {'favorites.map_id': 'maps.id'})
      .where({
        'favorites.user_id': req.session.user_id
      });
      currentList = 'Favorites';
    }
    //Query for maps who user contributed for
    if (req.query.show === 'contrib') {
      selectMaps = knex('maps')
      .distinct('maps.id', 'maps.title', 'maps.user_id')
      .join('locations', {'locations.map_id': 'maps.id'})
      .where({
        'locations.user_id': req.session.user_id
      });
      currentList = 'Contributed';
    }
    //Promisse
    selectMaps.then(maps => {
      Promise.all(maps.map(thumbnail.createUrl))
      .then((maps) => {
        if (req.session.user_id) {
          res.render('./maps/index', {
            maps: maps,
            mapsLists: mapsLists,
            currentList: currentList
          });
        } else {
          res.render('./maps/public', {
            maps: maps
          });
        }
      })
      .catch(() => {
        console.log("OH MY LORD, WHY WHY WHY DID IT HAVE TO BE BEEEEEEESSSSSSSSSS");
      });

    });
  });

  //POST METHODS
  //POST were not tested yet.
  //Favorite a Map
  router.post("/favorite", (req, res) => {
    const user_id = req.session.user_id;
    const map_id = req.body.map_id;
    if (req.body.isFaved) {
      knex('favorites')
      .del()
      .where({
        user_id: user_id,
        map_id: req.body.map_id
      }).then(() => {
        res.status(201).send("Map favourited");
      });
    } else {
      knex('favorites')
      .insert({
        user_id: req.session.user_id,
        map_id: req.body.map_id
      }).then(() => {
        res.status(201).send("Map unfavourited");
      });
    }
  });

  //Add a Map
  router.post("/", (req, res) => {
    knex('maps')
    .insert({
      title: req.body.title,
      user_id: req.session.user_id })
    .returning('id')
    .then((id) => {
      res.redirect(`/maps/${id}`);
    });
  });



//Get a single map
  router.get("/:map_id", (req, res) => {
    let map_id = req.params.map_id;
    let user_id = req.session.user_id;
    const locations = knex('locations')
      .select('*')
      .where('map_id', map_id);
    let isFavorited;
    if (user_id) {
      isFavorited = knex('favorites')
        .select('id')
        .where({
          "map_id": map_id,
          "user_id": user_id
        });
    } else {
      isFavorited = [];
    }
    res.locals.apiQuery = "&callback=initMap&libraries=places";
    Promise.all([locations, isFavorited]).then(mapData => {
      res.render("maps_show", {
        locations: mapData[0],
        isFavorited: mapData[1].length ? true : null,
        loggedIn: user_id ? true : null,
        mapId: map_id
      });
    });
  });

  return router;
};
