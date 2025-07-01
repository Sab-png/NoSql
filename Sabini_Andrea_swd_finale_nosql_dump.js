// Connessione al database
use ('foodDeliveryDB'); 

// 1. CREAZIONE DELLE COLLEZIONI E INDICI

// Creazione collezione dishes con validazione schema
db.createCollection("dishes", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["name", "description", "price", "category"],
         properties: {
            name: {
               bsonType: "string",
               description: "Nome del piatto - obbligatorio"
            },
            description: {
               bsonType: "string",
               description: "Descrizione del piatto - obbligatorio"
            },
            price: {
               bsonType: "number",
               minimum: 0,
               description: "Prezzo del piatto - obbligatorio e >= 0"
            },
            category: {
               bsonType: "string",
               enum: ["antipasto", "primo", "secondo", "dolce", "bevanda"],
               description: "Categoria del piatto - obbligatorio"
            },
            preparationTime: {
               bsonType: "int",
               minimum: 1,
               description: "Tempo di preparazione in minuti"
            },
            calories: {
               bsonType: "int",
               minimum: 0,
               description: "Calorie per porzione"
            },
            isActive: {
               bsonType: "bool",
               description: "Indica se il piatto è attualmente disponibile"
            }
         }
      }
   }
});

// Creazione collezione customers con validazione schema
db.createCollection("customers", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["firstName", "lastName", "email", "registrationDate", "addresses"],
         properties: {
            firstName: {
               bsonType: "string",
               description: "Nome del cliente - obbligatorio"
            },
            lastName: {
               bsonType: "string",
               description: "Cognome del cliente - obbligatorio"
            },
            email: {
               bsonType: "string",
               pattern: "^.+@.+\\..+$",
               description: "Email del cliente - obbligatorio e univoco"
            },
            registrationDate: {
               bsonType: "date",
               description: "Data di registrazione - obbligatorio"
            },
            addresses: {
               bsonType: "array",
               minItems: 1,
               items: {
                  bsonType: "object",
                  required: ["street", "city", "zipCode"],
                  properties: {
                     street: {
                        bsonType: "string",
                        description: "Via e numero civico"
                     },
                     city: {
                        bsonType: "string",
                        description: "Città"
                     },
                     zipCode: {
                        bsonType: "string",
                        description: "Codice postale"
                     },
                     apartment: {
                        bsonType: "string",
                        description: "Interno/appartamento"
                     },
                     isDefault: {
                        bsonType: "bool",
                        description: "Indirizzo predefinito"
                     }
                  }
               }
            }
         }
      }
   }
});

// Creazione collezione orders con validazione schema
db.createCollection("orders", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["customerId", "creationDate", "status", "items", "deliveryAddress"],
         properties: {
            customerId: {
               bsonType: "objectId",
               description: "ID del cliente - obbligatorio"
            },
            creationDate: {
               bsonType: "date",
               description: "Data di creazione ordine - obbligatorio"
            },
            status: {
               bsonType: "string",
               enum: ["in preparazione", "in consegna", "completato", "annullato"],
               description: "Stato dell'ordine - obbligatorio"
            },
            items: {
               bsonType: "array",
               minItems: 1,
               items: {
                  bsonType: "object",
                  required: ["dishId", "dishName", "quantity", "unitPrice", "totalPrice"],
                  properties: {
                     dishId: {
                        bsonType: "objectId",
                        description: "ID del piatto"
                     },
                     dishName: {
                        bsonType: "string",
                        description: "Nome del piatto (snapshot)"
                     },
                     quantity: {
                        bsonType: "int",
                        minimum: 1,
                        description: "Quantità ordinata"
                     },
                     unitPrice: {
                        bsonType: "number",
                        minimum: 0,
                        description: "Prezzo unitario al momento dell'ordine"
                     },
                     totalPrice: {
                        bsonType: "number",
                        minimum: 0,
                        description: "Prezzo totale per questo item"
                     }
                  }
               }
            },
            deliveryAddress: {
               bsonType: "object",
               required: ["street", "city", "zipCode"],
               properties: {
                  street: { bsonType: "string" },
                  city: { bsonType: "string" },
                  zipCode: { bsonType: "string" },
                  apartment: { bsonType: "string" }
               }
            },
            totalAmount: {
               bsonType: "number",
               minimum: 0,
               description: "Importo totale dell'ordine"
            },
            notes: {
               bsonType: "string",
               description: "Note aggiuntive per l'ordine"
            }
         }
      }
   }
});

// 2. CREAZIONE INDICI PER PERFORMANCE

// Indici per dishes
db.dishes.createIndex({ "name": 1 });
db.dishes.createIndex({ "category": 1 });
db.dishes.createIndex({ "price": 1 });
db.dishes.createIndex({ "isActive": 1 });

// Indici per customers
db.customers.createIndex({ "email": 1 }, { unique: true });
db.customers.createIndex({ "firstName": 1, "lastName": 1 });
db.customers.createIndex({ "registrationDate": 1 });

// Indici per orders
db.orders.createIndex({ "customerId": 1 });
db.orders.createIndex({ "creationDate": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "items.dishId": 1 });
db.orders.createIndex({ "creationDate": 1, "status": 1 });

// 3. POPOLAMENTO DEL DATABASE

print("Iniziando il popolamento del database...");

// Inserimento piatti
print("Inserimento piatti...");
db.dishes.insertMany([
   {
      name: "Bruschetta al Pomodoro",
      description: "Pane tostato con pomodori freschi, basilico e aglio",
      price: 8.50,
      category: "antipasto",
      preparationTime: 10,
      calories: 180,
      isActive: true
   },
   {
      name: "Antipasto Misto",
      description: "Selezione di salumi, formaggi e verdure sott'olio",
      price: 16.00,
      category: "antipasto",
      preparationTime: 15,
      calories: 320,
      isActive: true
   },
   {
      name: "Spaghetti alla Carbonara",
      description: "Spaghetti con uova, pecorino, guanciale e pepe nero",
      price: 14.00,
      category: "primo",
      preparationTime: 20,
      calories: 450,
      isActive: true
   },
   {
      name: "Risotto ai Funghi Porcini",
      description: "Risotto cremoso con funghi porcini e parmigiano",
      price: 18.50,
      category: "primo",
      preparationTime: 25,
      calories: 380,
      isActive: true
   },
   {
      name: "Lasagne della Casa",
      description: "Lasagne con ragù di carne, besciamella e parmigiano",
      price: 16.50,
      category: "primo",
      preparationTime: 30,
      calories: 520,
      isActive: true
   },
   {
      name: "Bistecca alla Fiorentina",
      description: "Bistecca di manzo alla griglia con rosmarino",
      price: 28.00,
      category: "secondo",
      preparationTime: 20,
      calories: 650,
      isActive: true
   },
   {
      name: "Branzino in Crosta",
      description: "Branzino fresco in crosta di sale con erbe aromatiche",
      price: 22.00,
      category: "secondo",
      preparationTime: 35,
      calories: 280,
      isActive: true
   },
   {
      name: "Pollo alle Olive",
      description: "Petto di pollo con olive taggiasche e pomodorini",
      price: 19.00,
      category: "secondo",
      preparationTime: 25,
      calories: 420,
      isActive: true
   },
   {
      name: "Tiramisù",
      description: "Dolce tradizionale con mascarpone, caffè e cacao",
      price: 7.50,
      category: "dolce",
      preparationTime: 5,
      calories: 380,
      isActive: true
   },
   {
      name: "Panna Cotta ai Frutti di Bosco",
      description: "Panna cotta vanilla con coulis di frutti di bosco",
      price: 8.00,
      category: "dolce",
      preparationTime: 5,
      calories: 250,
      isActive: true
   }
]);

// Inserimento clienti
print("Inserimento clienti...");
db.customers.insertMany([
   {
      firstName: "Mario",
      lastName: "Rossi",
      email: "mario.rossi@email.com",
      registrationDate: new Date("2024-01-15"),
      addresses: [
         {
            street: "Via Roma 123",
            city: "Milano",
            zipCode: "20100",
            apartment: "Interno 5",
            isDefault: true
         },
         {
            street: "Corso Buenos Aires 45",
            city: "Milano",
            zipCode: "20124",
            isDefault: false
         }
      ]
   },
   {
      firstName: "Giulia",
      lastName: "Bianchi",
      email: "giulia.bianchi@email.com",
      registrationDate: new Date("2024-02-20"),
      addresses: [
         {
            street: "Via Torino 67",
            city: "Roma",
            zipCode: "00100",
            isDefault: true
         }
      ]
   },
   {
      firstName: "Alessandro",
      lastName: "Verdi",
      email: "alessandro.verdi@email.com",
      registrationDate: new Date("2024-03-10"),
      addresses: [
         {
            street: "Piazza Duomo 8",
            city: "Firenze",
            zipCode: "50100",
            apartment: "Piano 2",
            isDefault: true
         }
      ]
   },
   {
      firstName: "Francesca",
      lastName: "Neri",
      email: "francesca.neri@email.com",
      registrationDate: new Date("2024-04-05"),
      addresses: [
         {
            street: "Via Nazionale 234",
            city: "Napoli",
            zipCode: "80100",
            isDefault: true
         },
         {
            street: "Corso Umberto 156",
            city: "Napoli",
            zipCode: "80138",
            apartment: "Scala B",
            isDefault: false
         }
      ]
   },
   {
      firstName: "Luca",
      lastName: "Ferrari",
      email: "luca.ferrari@email.com",
      registrationDate: new Date("2024-05-12"),
      addresses: [
         {
            street: "Via Garibaldi 89",
            city: "Bologna",
            zipCode: "40100",
            isDefault: true
         }
      ]
   }
]);

// Recupero degli ID per creare gli ordini
print("Recupero ID per la creazione degli ordini...");
const customers = db.customers.find().toArray();
const dishes = db.dishes.find().toArray();

// Inserimento ordini
print("Inserimento ordini...");
db.orders.insertMany([
   {
      customerId: customers[0]._id, // Mario Rossi
      creationDate: new Date("2024-06-01T19:30:00Z"),
      status: "completato",
      items: [
         {
            dishId: dishes[0]._id, // Bruschetta
            dishName: "Bruschetta al Pomodoro",
            quantity: 2,
            unitPrice: 8.50,
            totalPrice: 17.00
         },
         {
            dishId: dishes[2]._id, // Carbonara
            dishName: "Spaghetti alla Carbonara",
            quantity: 1,
            unitPrice: 14.00,
            totalPrice: 14.00
         },
         {
            dishId: dishes[8]._id, // Tiramisù
            dishName: "Tiramisù",
            quantity: 1,
            unitPrice: 7.50,
            totalPrice: 7.50
         }
      ],
      deliveryAddress: {
         street: "Via Roma 123",
         city: "Milano",
         zipCode: "20100",
         apartment: "Interno 5"
      },
      totalAmount: 38.50,
      notes: "Consegna dopo le 20:00"
   },
   {
      customerId: customers[1]._id, // Giulia Bianchi
      creationDate: new Date("2024-06-15T20:15:00Z"),
      status: "in consegna",
      items: [
         {
            dishId: dishes[3]._id, // Risotto
            dishName: "Risotto ai Funghi Porcini",
            quantity: 1,
            unitPrice: 18.50,
            totalPrice: 18.50
         },
         {
            dishId: dishes[6]._id, // Branzino
            dishName: "Branzino in Crosta",
            quantity: 1,
            unitPrice: 22.00,
            totalPrice: 22.00
         }
      ],
      deliveryAddress: {
         street: "Via Torino 67",
         city: "Roma",
         zipCode: "00100"
      },
      totalAmount: 40.50
   },
   {
      customerId: customers[0]._id, // Mario Rossi (secondo ordine)
      creationDate: new Date("2024-06-20T19:45:00Z"),
      status: "in preparazione",
      items: [
         {
            dishId: dishes[4]._id, // Lasagne
            dishName: "Lasagne della Casa",
            quantity: 2,
            unitPrice: 16.50,
            totalPrice: 33.00
         },
         {
            dishId: dishes[9]._id, // Panna Cotta
            dishName: "Panna Cotta ai Frutti di Bosco",
            quantity: 2,
            unitPrice: 8.00,
            totalPrice: 16.00
         }
      ],
      deliveryAddress: {
         street: "Corso Buenos Aires 45",
         city: "Milano",
         zipCode: "20124"
      },
      totalAmount: 49.00,
      notes: "Chiamare al citofono 'Rossi'"
   }
]);

// 4. VERIFICA DEL POPOLAMENTO

print("\n=== VERIFICA POPOLAMENTO DATABASE ===");
print("Piatti inseriti: " + db.dishes.countDocuments());
print("Clienti inseriti: " + db.customers.countDocuments());
print("Ordini inseriti: " + db.orders.countDocuments());

print("\n=== ESEMPIO DI DOCUMENTI INSERITI ===");
print("\nPrimo piatto:");
printjson(db.dishes.findOne());

print("\nPrimo cliente:");
printjson(db.customers.findOne());

print("\nPrimo ordine:");
printjson(db.orders.findOne());

print("\n=== DATABASE POPOLATO CON SUCCESSO ===");

// 5. QUERY RICHIESTE

print("\n=== ESECUZIONE QUERY RICHIESTE ===");

// Q1: Trova tutti i piatti con un prezzo superiore a 15€
print("\nQ1 - Piatti con prezzo > 15€:");
db.dishes.find(
   { price: { $gt: 15 } },
   { name: 1, price: 1, category: 1 }
).forEach(printjson);

// Q2: Elenca gli ordini effettuati da Mario Rossi
print("\nQ2 - Ordini di Mario Rossi:");
const marioId = db.customers.findOne({ email: "mario.rossi@email.com" })._id;
db.orders.find(
   { customerId: marioId },
   { creationDate: 1, status: 1, totalAmount: 1, "items.dishName": 1 }
).forEach(printjson);

// Q3: Aggiorna lo stato di un ordine a "completato"
print("\nQ3 - Aggiornamento stato ordine:");
const orderToUpdate = db.orders.findOne({ status: "in preparazione" });
if (orderToUpdate) {
   const updateResult = db.orders.updateOne(
      { _id: orderToUpdate._id },
      { $set: { status: "completato" } }
   );
   print("Ordine aggiornato: " + updateResult.modifiedCount + " documento/i");
}

// Q4: Trova i clienti che hanno effettuato almeno 2 ordini
print("\nQ4 - Clienti con almeno 2 ordini:");
db.orders.aggregate([
   { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
   { $match: { orderCount: { $gte: 2 } } },
   { $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "_id",
      as: "customerInfo"
   }},
   { $project: {
      "customerInfo.firstName": 1,
      "customerInfo.lastName": 1,
      "customerInfo.email": 1,
      orderCount: 1
   }}
]).forEach(printjson);

// Q5: Individua il piatto più ordinato
print("\nQ5 - Piatto più ordinato:");
db.orders.aggregate([
   { $unwind: "$items" },
   { $group: {
      _id: "$items.dishId",
      dishName: { $first: "$items.dishName" },
      totalQuantity: { $sum: "$items.quantity" }
   }},
   { $sort: { totalQuantity: -1 } },
   { $limit: 1 }
]).forEach(printjson);

print("\n=== SCRIPT COMPLETATO CON SUCCESSO ===");