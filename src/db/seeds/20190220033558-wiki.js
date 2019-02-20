'use strict';

const User = require('../models').User;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return User.findAll()
    .then((users) =>
    {
      return queryInterface.bulkInsert(
        'Wikis',
        [
          {
            createdAt: new Date(), updatedAt: new Date(),
            userId: users[0].id,
            title: 'NHL',
            slug: 'nhl',
            body: 'The National Hockey League (NHL) is a professional ice hockey league in North America, currently comprising 31 teams: 24 in the United States and 7 in Canada. The NHL is considered to be the premier professional ice hockey league in the world, and one of the major professional sports leagues in the United States and Canada. The Stanley Cup, the oldest professional sports trophy in North America, is awarded annually to the league playoff champion at the end of each season.'
          },
          {
            createdAt: new Date(), updatedAt: new Date(),
            userId: users[1].id,
            title: 'Toronto',
            slug: 'toronto',
            body: "Toronto is the provincial capital of Ontario and the most populous city in Canada, with a population of 2,731,571 in 2016. Current to 2016, the Toronto census metropolitan area (CMA), of which the majority is within the Greater Toronto Area (GTA), held a population of 5,928,040, making it Canada's most populous CMA. Toronto is the anchor of an urban agglomeration, known as the Golden Horseshoe in Southern Ontario, located on the northwestern shore of Lake Ontario. A global city, Toronto is a centre of business, finance, arts, and culture, and is recognized as one of the most multicultural and cosmopolitan cities in the world."
          },
          {
            createdAt: new Date(), updatedAt: new Date(),
            userId: users[2].id,
            title: 'Pizza',
            slug: 'pizza',
            body: "Pizza is a savory dish of Italian origin, consisting of a usually round, flattened base of leavened wheat-based dough topped with tomatoes, cheese, and various other ingredients (anchovies, olives, meat, etc.) baked at a high temperature, traditionally in a wood-fired oven. In formal settings, like a restaurant, pizza is eaten with knife and fork, but in casual settings it is cut into wedges to be eaten while held in the hand. Small pizzas are sometimes called pizzettas. The term pizza was first recorded in the 10th century in a Latin manuscript from the Southern Italian town of Gaeta in Lazio, on the border with Campania. Modern pizza was invented in Naples, and the dish and its variants have since become popular in many countries. It has become one of the most popular foods in the world and a common fast food item in Europe and North America, available at pizzerias (restaurants specializing in pizza), restaurants offering Mediterranean cuisine, and via pizza delivery. Many companies sell ready-baked frozen pizzas to be reheated in an ordinary home oven."
          }
        ],
        {}
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(
      'Wikis',
      null
    );
  }
};
