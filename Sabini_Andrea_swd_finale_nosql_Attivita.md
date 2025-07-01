# Attività

## 1. Modellazione del Database

### **1.1 Progettazione Schema Documentale**

#### **Identificazione Collezioni Principali**
Definizione delle collezioni MongoDB necessarie:

- **`dishes`**: Catalogo completo dei piatti disponibili
- **`customers`**: Anagrafica clienti con informazioni di contatto
- **`orders`**: Gestione ordini e tracking stati

#### **Definizione Campi per Collezione**

**Collezione `dishes`**:
```javascript
{
  name: String,           // Nome piatto (obbligatorio)
  description: String,    // Descrizione dettagliata (obbligatorio)
  price: Number,          // Prezzo in euro (obbligatorio, >= 0)
  category: String,       // Categoria (enum: antipasto|primo|secondo|dolce)
  preparationTime: Int,   // Minuti preparazione (opzionale)
  calories: Int,          // Calorie per porzione (opzionale)
  isActive: Boolean       // Disponibilità nel menu (opzionale)
}
```

**Collezione `customers`**:
```javascript
{
  firstName: String,      // Nome (obbligatorio)
  lastName: String,       // Cognome (obbligatorio)
  email: String,          // Email univoca (obbligatorio)
  registrationDate: Date, // Data registrazione (obbligatorio)
  addresses: [            // Array indirizzi (obbligatorio, min 1)
    {
      street: String,     // Via e numero (obbligatorio)
      city: String,       // Città (obbligatorio)
      zipCode: String,    // CAP (obbligatorio)
      apartment: String,  // Interno (opzionale)
      isDefault: Boolean  // Indirizzo predefinito (opzionale)
    }
  ]
}
```

**Collezione `orders`**:
```javascript
{
  customerId: ObjectId,   // Reference al cliente (obbligatorio)
  creationDate: Date,     // Data creazione (obbligatorio)
  status: String,         // Stato ordine (enum predefinito)
  items: [                // Piatti ordinati (obbligatorio, min 1)
    {
      dishId: ObjectId,   // Reference al piatto
      dishName: String,   // Nome piatto (snapshot)
      quantity: Int,      // Quantità (>= 1)
      unitPrice: Number,  // Prezzo unitario snapshot
      totalPrice: Number  // Prezzo totale item
    }
  ],
  deliveryAddress: {      // Indirizzo consegna (embedded)
    street: String,
    city: String,
    zipCode: String,
    apartment: String
  },
  totalAmount: Number,    // Totale ordine (opzionale)
  notes: String          // Note consegna (opzionale)
}
```

### **1.2 Decisioni Architetturali: Embedding vs Reference**

## Indirizzi Clienti → EMBEDDED**

*Motivazione*:
- **Alta coesione**: Indirizzi sempre letti con dati cliente
- **Bassa cardinalità**: Tipicamente 1-3 indirizzi per cliente
- **Atomic updates**: Modifiche cliente e indirizzi in singola operazione
- **Performance**: Evita join per recupero profilo completo
- **Consistency**: Dati sempre sincronizzati

*Implementazione*:
```javascript
// Schema embedded per indirizzi
{
  "_id": ObjectId("..."),
  "firstName": "Mario",
  "lastName": "Rossi",
  "addresses": [
    {
      "street": "Via Roma 123",
      "city": "Milano",
      "zipCode": "20100",
      "isDefault": true
    }
  ]
}
```

## Dettagli Piatti negli Ordini → SNAPSHOT EMBEDDED + REFERENCE**

*Motivazione*:
- **Immutabilità storica**: Prezzi ordini non devono cambiare
- **Performance lettura**: Visualizzazione ordini senza join
- **Dual purpose**: Reference per analytics, snapshot per display
- **Audit compliance**: Tracciabilità completa ordini storici

*Implementazione*:
```javascript
// Approccio ibrido negli ordini
{
  "items": [
    {
      "dishId": ObjectId("..."),        // Reference per analisi
      "dishName": "Spaghetti Carbonara", // Snapshot per display
      "quantity": 2,
      "unitPrice": 14.00,               // Prezzo al momento ordine
      "totalPrice": 28.00
    }
  ]
}
```

## Relazione Cliente-Ordini → REFERENCE**

*Motivazione*:
- **Scalabilità**: Cliente può avere molti ordini nel tempo
- **Normalizzazione**: Evita duplicazione dati cliente
- **Flessibilità query**: Interrogazioni separate su clienti/ordini
- **Size management**: Evita documenti cliente troppo grandi
- **Update efficiency**: Modifiche cliente non impattano ordini

*Implementazione*:
```javascript
// Reference negli ordini
{
  "customerId": ObjectId("..."),  // Link al documento cliente
  "creationDate": ISODate("..."),
  // ... altri campi ordine
}
```

---

## 2. Creazione e Popolamento

### **2.1 Setup Database MongoDB**

#### **Creazione Database**
```javascript
// Connessione e selezione database
use foodDeliveryDB;
```

#### **Definizione Collezioni con Validazione**

**Implementazione JSON Schema Validation**:
- Validazione tipi dati obbligatori
- Controlli range per valori numerici
- Pattern matching per email
- Enumerazioni per campi categorici
- Vincoli cardinalità per array

### **2.2 Implementazione Indici**

#### **Strategia di Indicizzazione**

**Collezione `dishes`**:
```javascript
db.dishes.createIndex({ "name": 1 });        // Ricerca nome
db.dishes.createIndex({ "category": 1 });    // Filtro categoria
db.dishes.createIndex({ "price": 1 });       // Range prezzo
db.dishes.createIndex({ "isActive": 1 });    // Filtro disponibilità
```

**Collezione `customers`**:
```javascript
db.customers.createIndex({ "email": 1 }, { unique: true }); // Email univoca
db.customers.createIndex({ "firstName": 1, "lastName": 1 }); // Nome completo
db.customers.createIndex({ "registrationDate": 1 });        // Ordinamento data
```

**Collezione `orders`**:
```javascript
db.orders.createIndex({ "customerId": 1 });              // Ordini per cliente
db.orders.createIndex({ "creationDate": 1 });            // Ordinamento temporale
db.orders.createIndex({ "status": 1 });                  // Filtro stato
db.orders.createIndex({ "items.dishId": 1 });            // Analisi piatti
db.orders.createIndex({ "creationDate": 1, "status": 1 }); // Compound index
```

### **2.3 Popolamento Dati di Test**

#### **Dataset Rappresentativo**

**5 Clienti Diversificati**:
- Clienti con indirizzi multipli e singoli
- Date registrazione distribuite nel tempo
- Email univoche validate
- Copertura geografica italiana

**10 Piatti Assortiti**:
- Distribuzione equa tra categorie
- Range prezzi realistico (€7-28)
- Tempi preparazione variabili
- Informazioni nutrizionali complete

**3 Ordini Multi-Stato**:
- Stati diversi: completato, in consegna, in preparazione
- Clienti diversi e ricorrenti
- Combinazioni piatti realistiche
- Date distribuite nel tempo

---

## 3. Implementazione Query

### **3.1 Query Obbligatorie**

#### **Q1: Ricerca Piatti per Prezzo**
```javascript
db.dishes.find(
   { price: { $gt: 15 } },
   { name: 1, price: 1, category: 1 }
);
```
**Operatori**: `$gt` (greater than), projection fields

#### **Q2: Ordini per Cliente**
```javascript
// Metodo A: Per ObjectId cliente
db.orders.find({ customerId: ObjectId("...") });

// Metodo B: Per email cliente (con lookup)
db.orders.aggregate([
   { $lookup: { from: "customers", localField: "customerId", 
                foreignField: "_id", as: "customer" }},
   { $match: { "customer.email": "mario.rossi@email.com" }}
]);
```
**Operatori**: `$lookup`, `$match`, projection

#### **Q3: Aggiornamento Stato Ordine**
```javascript
db.orders.updateOne(
   { _id: ObjectId("...") },
   { $set: { status: "completato" } }
);
```
**Operatori**: `$set`, updateOne

#### **Q4: Clienti Frequenti (≥2 ordini)**
```javascript
db.orders.aggregate([
   { $group: { _id: "$customerId", orderCount: { $sum: 1 } }},
   { $match: { orderCount: { $gte: 2 } }},
   { $lookup: { from: "customers", localField: "_id", 
                foreignField: "_id", as: "customerInfo" }},
   { $project: { "customerInfo.firstName": 1, "customerInfo.lastName": 1, 
                 "customerInfo.email": 1, orderCount: 1 }}
]);
```
**Operatori**: `$group`, `$sum`, `$match`, `$gte`, `$lookup`, `$project`

#### **Q5: Piatto Più Ordinato**
```javascript
// Per tutto il periodo
db.orders.aggregate([
   { $unwind: "$items" },
   { $group: { _id: "$items.dishId", dishName: { $first: "$items.dishName" },
               totalQuantity: { $sum: "$items.quantity" } }},
   { $sort: { totalQuantity: -1 }},
   { $limit: 1 }
]);

// Per intervallo date specifico
db.orders.aggregate([
   { $match: { creationDate: { $gte: ISODate("2024-06-01"), 
                               $lte: ISODate("2024-06-30") }}},
   { $unwind: "$items" },
   { $group: { _id: "$items.dishId", dishName: { $first: "$items.dishName" },
               totalQuantity: { $sum: "$items.quantity" }}},
   { $sort: { totalQuantity: -1 }},
   { $limit: 1 }
]);
```
**Operatori**: `$match`, `$unwind`, `$group`, `$sum`, `$first`, `$sort`, `$limit`, `$gte`, `$lte`

### **3.2 Documentazione Operatori**

**Operatori di Confronto**:
- `$gt`, `$gte`: Confronti numerici e date
- `$lt`, `$lte`: Range e filtri

**Operatori di Aggregazione**:
- `$group`: Raggruppamento dati
- `$sum`: Sommatorie e conteggi
- `$first`: Primo valore per gruppo
- `$match`: Filtri in pipeline
- `$unwind`: Scomposizione array
- `$lookup`: Join tra collezioni
- `$project`: Formattazione output
- `$sort`: Ordinamento risultati
- `$limit`: Limitazione risultati

**Operatori di Update**:
- `$set`: Aggiornamento campi specifici
- `updateOne`: Modifica singolo documento

---

## 4. Testing e Verifica

### **4.1 Test Funzionali**

#### **Verifica Inserimento Dati**
- Controllo conteggi documenti per collezione
- Validazione integrità referenze
- Test vincoli validazione schema

#### **Test Performance Query**
- Misurazione tempi risposta query principali
- Verifica utilizzo indici con `explain()`
- Analisi execution stats

### **4.2 Ottimizzazione Performance**

#### **Analisi Indici**
```javascript
// Verifica utilizzo indici
db.orders.find({customerId: ObjectId("...")}).explain("executionStats");

// Statistiche indici
db.orders.aggregate([{$indexStats: {}}]);
```

#### **Monitoring Query**
```javascript
// Abilitazione profiling
db.setProfilingLevel(2);

// Analisi query 
db.system.profile.find().sort({ts: -1}).limit(5);
```

---

## 5. Deliverable Tecnici

### **5.1 Script Database**
- File JavaScript completo per setup
- Validazione schema JSON integrata
- Dati di test rappresentativi
- Query di verifica funzionamento

### **5.2 Documentazione Tecnica**
- Analisi decisioni architetturali
- Spiegazione dettagliata operatori MongoDB
- Guida setup e manutenzione
- Esempi utilizzo pratico

### **5.3 Testing Suite**
- Script verifica funzionalità
- Test performance query critiche
- Validazione integrità dati
- Procedure backup/restore

