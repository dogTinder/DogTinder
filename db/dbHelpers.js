const db = require('./dbConnection.js');

exports.addOrFindUser = (email, password, facebookID, callback) => {
  db.User.findOrCreate({where: {
    email: email,
    password: password,
    facebookID: facebookID
  }}).then((result) => callback(result[0].dataValues));
};

exports.getUserId = (userLookUp, callback) => {
  db.User.findOne({where: userLookUp})
         .then((result) => { callback(result.dataValues.id) })
};

exports.addShelter = (address, phone, name, zip, callback) => {
  db.Shelter.create({
    address: address,
    phone: phone,
    name: name,
    zip: zip
  }).then((result) => { callback() })
};

exports.saveAnimals = (animalObjArr, callback) => {
  if (animalObjArr.length === 0) {
    callback();
  } else {
    const animal = animalObjArr.pop()
    console.log('ANIMAL: ', animal);

    db.Animal.findOrCreate({where: animal})
             .then(() => {
               exports.saveAnimals(animalObjArr, callback)
             })
  }
};

exports.addBreedsToAnimal = (animalLookup, breeds, callback) => {
  db.Animal.findOne({where: animalLookup})
           .then( (animal) => {animal.setBreeds(breeds)} )
           .then( () => {callback()} )
};

exports.getAnimalBreeds = (animalId, callback) => {
  let queryString = `SELECT breeds.breed
    FROM breeds
    INNER JOIN "Animal_Breeds"
    ON "breedId" = breeds.id
    WHERE "Animal_Breeds"."animalId" = ${animalId};`;

  db.sequelize.query(queryString).spread((results, metadata) => {
    
    callback(results, metadata);
  });
};

exports.createAnimalList = (userLookup, callback) => {  
  db.AnimalList.create()
               .then((list) => {
                 db.User.findOne({where: userLookup})
                        .then((user) => {
                          list.setUser(user);
                        })
                        .then(() =>{
                          callback();
                        })
                        
               }) 
};

exports.addAnimalsToList = (UserId, animalIdArr, callback) => {
  db.AnimalList.findOne({where: {userId : UserId}})
               .then((list) => {
                 list.setAnimals(animalIdArr);
               })
               .then(callback())
};

exports.findUserList = (UserId, callback) => {
  db.AnimalList.findOne({where: {userId: UserId}})
               .then((list) => {
                 callback(list);
               })
};

exports.updateList = (list, animalIdArr, callback) => {
  if (animalIdArr.length > 0) {
    let animal = animalIdArr.pop();
    list.addAnimal(animal)
        .then(() => {
          exports.updateList(list, animalIdArr, callback)
        })
  } else {
    callback();
  } 
}

exports.getUserAnimals = (listId, callback) => {
  let queryString = `
    SELECT animals."petFinderid"
    FROM "AnimalList_Animal"
    INNER JOIN animals
    ON "AnimalList_Animal"."animalId" = animals.id
    WHERE "AnimalList_Animal"."animalListId" = ${listId};
  `;

  db.sequelize.query(queryString).spread((results, metadata) => {
    callback(results, metadata);
  });
};

exports.findBreedIds = (breedObjArr, callback) => {
  let ids = [];

  const recurseAnimals = (breedObjArr, callback) => {
    if (breedObjArr.length > 0) {
      let currentBreed = breedObjArr.pop();
      db.Breed.findOne({where: currentBreed})
               .then((breed) => {
                 ids.push(breed.dataValues.id);
                 recurseAnimals(breedObjArr, callback);
               })
    } else {
      callback(ids);
    }
  }

  recurseAnimals(breedObjArr, callback);
};

exports.findAnimalIds = (animalObjArr, callback) => {
  let ids = [];

  const recurseAnimals = (animalObjArr, callback) => {
    if (animalObjArr.length > 0) {
      let currentAnimal = animalObjArr.pop();
      db.Animal.findOne({where: currentAnimal})
               .then((animal) => {
                 ids.push(animal.dataValues.id);
                 recurseAnimals(animalObjArr, callback);
               })
    } else {
      callback(ids);
    }
  }

  recurseAnimals(animalObjArr, callback);
};

exports.removeDuplicatesFromAnimalList = (listId, updateAnimalIdArr, callback) => {
  let queryString = `
    SELECT "animalId" FROM "AnimalList_Animal"
    WHERE "animalListId" = ${listId};
  `

  db.sequelize.query(queryString).spread((results, metadata) => {
    animalIdsToAdd = [];
    exisitingList = results.map(id => id.animalId);

    updateAnimalIdArr.forEach((id) => {
      if (exisitingList.indexOf(id) === -1) {
        animalIdsToAdd.push(id);
      }
    });

    callback(animalIdsToAdd);
  })
};

exports.checkForUserList = (facebookID, callback) => {
  let queryString = `
    SELECT "animalLists".id 
    FROM "animalLists"
    INNER JOIN users
    ON users.id = "animalLists"."userId"
    WHERE users."facebookID" = '${facebookID}';
  `

  db.sequelize.query(queryString).spread((results, metadata) => {
    callback(results, metadata);
  })
}

