# REQUISITI

## Panoramica del Sistema

Il sistema di gestione per il servizio di consegna pasti è progettato per supportare le operazioni di un'azienda di cucine centralizzate che offre consegne a domicilio. Il database MongoDB `foodDeliveryDB` gestisce tre entità principali:

- **Piatti**: Catalog dei prodotti disponibili
- **Clienti**: Anagrafica clienti con indirizzi di consegna
- **Ordini**: Gestione degli ordini con dettagli di consegna

---

### **Piatti**
Ogni piatto nel sistema deve contenere le seguenti informazioni:

#### Campi Obbligatori
- **Nome**: Denominazione del piatto
- **Descrizione**: Descrizione dettagliata del piatto e dei suoi ingredienti
- **Prezzo**: Costo del piatto (in euro)
- **Categoria**: Classificazione del piatto tra:
  - Antipasto
  - Primo
  - Secondo
  - Dolce

#### Campi Opzionali (Estensioni)
- **Tempo di preparazione**: Durata in minuti per la preparazione
- **Calorie**: Valore calorico per porzione
- **Disponibilità**: Stato di attivazione del piatto nel menu

### **Utenti (Clienti)**
Ogni cliente registrato nel sistema deve avere:

#### Informazioni Personali
- **Nome**: Nome del cliente
- **Cognome**: Cognome del cliente
- **Email**: Indirizzo email univoco per l'identificazione
- **Data di registrazione**: Timestamp della registrazione nel sistema

#### Indirizzi di Consegna
- **Gestione multipla**: Ogni cliente può avere uno o più indirizzi
- **Componenti indirizzo**:
  - Via e numero civico
  - Città
  - Codice postale (CAP)
  - Interno/appartamento (opzionale)
- **Indirizzo predefinito**: Marcatura dell'indirizzo principale

### **Ordini**
Ogni ordine deve tracciare:

#### Identificazione e Status
- **ID univoco**: Identificatore automatico dell'ordine
- **ID Cliente**: Riferimento al cliente che ha effettuato l'ordine
- **Data di creazione**: Timestamp di creazione dell'ordine
- **Stato ordine**: Fase corrente dell'ordine tra:
  - "In preparazione"
  - "In consegna"
  - "Completato"
  - "Annullato"

#### Contenuto Ordine
- **Lista piatti ordinati**: Array di piatti con le seguenti informazioni per ciascuno:
  - Riferimento al piatto (`dishId`)
  - Quantità ordinata
  - Prezzo snapshot al momento dell'ordine (per mantenere lo storico)
  - Nome del piatto (snapshot per visualizzazione)

#### Informazioni di Consegna
- **Indirizzo di consegna**: Copia dell'indirizzo selezionato dal cliente
- **Note speciali**: Istruzioni aggiuntive per la consegna (opzionale)
- **Importo totale**: Valore complessivo dell'ordine

---

## Requisiti Non Funzionali

### **Performance**
- Ottimizzazione per query frequenti (ricerca piatti, ordini cliente)
- Indicizzazione appropriata per supportare le operazioni principali
- Tempi di risposta accettabili per operazioni CRUD

### **Scalabilità**
- Struttura dati che supporti crescita del numero di clienti e ordini
- Gestione efficiente di cataloghi con centinaia di piatti
- Supporto per volumi di ordini crescenti

### **Integrità dei Dati**
- Validazione dei formati (email, prezzi, quantità)
- Consistenza dei dati tra collezioni correlate
- Mantenimento dello storico degli ordini immutabile

### **Usabilità**
- Schema comprensibile e manutenibile
- Supporto per query analitiche e report
- Facilità di estensione per nuove funzionalità

---

## Vincoli Tecnici

### **Dati di Test**
Il sistema deve essere popolato con dati rappresentativi:
- **Minimo 5 clienti** con profili diversificati
- **Minimo 10 piatti** di categorie diverse
- **Minimo 3 ordini** in stati diversi

---

## Casi d'Uso Principali

### **Gestione Catalogo**
1. Aggiunta nuovi piatti al menu
2. Modifica prezzi e descrizioni
3. Attivazione/disattivazione piatti
4. Ricerca piatti per categoria e prezzo

### **Gestione Clienti**
1. Registrazione nuovi clienti
2. Aggiornamento informazioni personali
3. Gestione indirizzi di consegna multipli
4. Visualizzazione storico ordini

### **Processamento Ordini**
1. Creazione nuovo ordine
2. Aggiornamento stato ordine
3. Calcolo totali automatico
4. Gestione annullamenti

### **Reporting e Analytics**
1. Analisi piatti più venduti
2. Statistiche clienti attivi
3. Report vendite per periodo
4. Analisi performance categorie

---

# ATTIVITA'

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

---

# CONSEGNA FINALE

## Modellazione del Database

### Collezioni Principali

Il database è strutturato in **tre collezioni principali**:

1. **`dishes`** - Catalogo piatti
2. **`customers`** - Anagrafica clienti
3. **`orders`** - Gestione ordini

### Approccio Ibrido

È stato adottato un **approccio ibrido** che combina embedding e reference in base ai pattern di utilizzo specifici:

- **Embedding**: Per dati che cambiano raramente e vengono letti insieme
- **Reference**: Per dati che cambiano frequentemente o vengono condivisi tra documenti

---

## Scelte Progettuali: Embedding vs Reference

### 1. Indirizzi Clienti - **EMBEDDED**

**Scelta**: Gli indirizzi sono incorporati direttamente nel documento `customer`.

**Motivazioni**:
- **Frequenza lettura**: Gli indirizzi vengono sempre letti insieme ai dati del cliente
- **Atomic operations**: Aggiornamenti di cliente e indirizzi in un'unica operazione
- **Performance**: Evita join per recuperare informazioni complete del cliente
- **Cardinalità**: Numero limitato di indirizzi per cliente 
- **Coerenza**: I dati rimangono sempre sincronizzati

```javascript
// Struttura embedded degli indirizzi
{
  "_id": ObjectId("..."),
  "firstName": "Mario",
  "lastName": "Rossi",
  "addresses": [
    {
      "street": "Via Roma 123",
      "city": "Milano",
      "zipCode": "20100",
      "apartment": "Interno 5",
      "isDefault": true
    }
  ]
}
```

### 2. Dettagli Piatti negli Ordini - **SNAPSHOT EMBEDDED**

**Scelta**: I dettagli dei piatti sono incorporati come snapshot nell'ordine, mantenendo anche il reference all'ID.

**Motivazioni**:
- **Immutabilità ordini**: I prezzi e nomi dei piatti al momento dell'ordine non devono cambiare
- **Performance lettura**: Visualizzazione ordini senza join con la collezione piatti
- **Storicità**: Mantenimento dello storico anche se un piatto viene modificato o rimosso
- **Auditing**: Tracciabilità completa degli ordini storici
- **Dual purpose**: Reference ID per analisi, snapshot per visualizzazione

```javascript
// Struttura ibrida negli ordini
{
  "items": [
    {
      "dishId": ObjectId("..."),        // Reference per analisi
      "dishName": "Spaghetti Carbonara", // Snapshot per visualizzazione
      "quantity": 2,
      "unitPrice": 14.00,               // Prezzo al momento dell'ordine
      "totalPrice": 28.00
    }
  ]
}
```

### 3. Relazione Cliente-Ordini - **REFERENCE**

**Scelta**: Gli ordini referenziano i clienti tramite `customerId`.

**Motivazioni**:
- **Normalizzazione**: Evita duplicazione dei dati cliente
- **Scalabilità**: Un cliente può avere molti ordini nel tempo
- **Integrità**: Aggiornamenti del cliente si riflettono automaticamente
- **Query flessibili**: Possibilità di query separate su clienti e ordini
- **Dimensioni documento**: Evita documenti cliente troppo grandi

---

## Schema delle Collezioni

### Collezione `dishes`

```javascript
{
  "_id": ObjectId("..."),
  "name": "Spaghetti alla Carbonara",           // Nome piatto
  "description": "Spaghetti con uova...",       // Descrizione dettagliata
  "price": 14.00,                               // Prezzo corrente
  "category": "primo",                           // Categoria (enum)
  "preparationTime": 20,                        // Tempo preparazione (minuti)
  "calories": 450,                              // Calorie per porzione
  "isActive": true                              // Disponibilità
}
```

**Campi obbligatori**: `name`, `description`, `price`, `category`
**Campi opzionali**: `preparationTime`, `calories`, `isActive`

### Collezione `customers`

```javascript
{
  "_id": ObjectId("..."),
  "firstName": "Mario",                         // Nome
  "lastName": "Rossi",                          // Cognome
  "email": "mario.rossi@email.com",            // Email (univoca)
  "registrationDate": ISODate("2024-01-15"),   // Data registrazione
  "addresses": [                                // Array indirizzi (embedded)
    {
      "street": "Via Roma 123",
      "city": "Milano",
      "zipCode": "20100",
      "apartment": "Interno 5",                 // Opzionale
      "isDefault": true                         // Indirizzo predefinito
    }
  ]
}
```

**Campi obbligatori**: `firstName`, `lastName`, `email`, `registrationDate`, `addresses`

### Collezione `orders`

```javascript
{
  "_id": ObjectId("..."),
  "customerId": ObjectId("..."),               // Reference al cliente
  "creationDate": ISODate("2024-06-01T19:30:00Z"),
  "status": "completato",                      // Stato ordine (enum)
  "items": [                                   // Array piatti (embedded snapshot)
    {
      "dishId": ObjectId("..."),               // Reference al piatto
      "dishName": "Spaghetti alla Carbonara", // Snapshot nome
      "quantity": 1,                          // Quantità
      "unitPrice": 14.00,                     // Prezzo unitario snapshot
      "totalPrice": 14.00                     // Prezzo totale item
    }
  ],
  "deliveryAddress": {                         // Indirizzo consegna (embedded)
    "street": "Via Roma 123",
    "city": "Milano",
    "zipCode": "20100",
    "apartment": "Interno 5"
  },
  "totalAmount": 38.50,                       // Totale ordine
  "notes": "Consegna dopo le 20:00"           // Note opzionali
}
```

**Campi obbligatori**: `customerId`, `creationDate`, `status`, `items`, `deliveryAddress`

---

## Indici e Performance

### Indici Implementati

#### Collezione `dishes`
- `{ "name": 1 }` - Ricerca per nome
- `{ "category": 1 }` - Filtro per categoria
- `{ "price": 1 }` - Ricerca per prezzo
- `{ "isActive": 1 }` - Filtro disponibilità

#### Collezione `customers`
- `{ "email": 1 }` - **UNIQUE** - Ricerca per email
- `{ "firstName": 1, "lastName": 1 }` - Ricerca per nome
- `{ "registrationDate": 1 }` - Ordinamento per data

#### Collezione `orders`
- `{ "customerId": 1 }` - Ricerca ordini per cliente
- `{ "creationDate": 1 }` - Ordinamento temporale
- `{ "status": 1 }` - Filtro per stato
- `{ "items.dishId": 1 }` - Analisi piatti ordinati
- `{ "creationDate": 1, "status": 1 }` - Compound index per query complesse

---

## Query Implementate

### Q1: Piatti con prezzo superiore a 15€

```javascript
db.dishes.find(
   { price: { $gt: 15 } },
   { name: 1, price: 1, category: 1 }
);
```

**Operatori utilizzati**:
- `$gt`: Confronto "greater than" per filtrare i prezzi
- **Projection**: Limita i campi restituiti per performance

**Spiegazione**: Query che utilizza l'indice su `price` per una ricerca efficiente.

### Q2: Ordini di un cliente specifico

```javascript
// Metodo 1: Per ObjectId
db.orders.find(
   { customerId: ObjectId("...") },
   { creationDate: 1, status: 1, totalAmount: 1 }
);

// Metodo 2: Per email (con lookup)
db.orders.aggregate([
   { $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
   }},
   { $match: { "customer.email": "mario.rossi@email.com" } },
   { $project: { creationDate: 1, status: 1, totalAmount: 1 } }
]);
```

**Operatori utilizzati**:
- `$lookup`: Join tra collezioni per metodo con email
- `$match`: Filtro sui risultati
- `$project`: Selezione campi output

### Q3: Aggiornamento stato ordine

```javascript
db.orders.updateOne(
   { _id: ObjectId("...") },
   { $set: { status: "completato" } }
);
```

**Operatori utilizzati**:
- `$set`: Aggiornamento di un campo specifico
- **updateOne**: Aggiorna un singolo documento matching

**Spiegazione**: Operazione atomica che aggiorna solo il campo status senza modificare altri dati.

### Q4: Clienti con almeno 2 ordini

```javascript
db.orders.aggregate([
   { $group: { 
      _id: "$customerId", 
      orderCount: { $sum: 1 } 
   }},
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
]);
```

**Operatori utilizzati**:
- `$group`: Raggruppa ordini per cliente e conta
- `$sum`: Conteggio ordini per cliente
- `$match`: Filtra clienti con almeno 2 ordini
- `$lookup`: Join per ottenere dati cliente
- `$project`: Formatta output finale
- `$gte`: Confronto "greater than or equal"

**Spiegazione**: Pipeline aggregation che prima conta gli ordini per cliente, poi filtra e arricchisce con i dati anagrafici.

### Q5: Piatto più ordinato

```javascript
// Query base per il piatto più ordinato globalmente
db.orders.aggregate([
   { $unwind: "$items" },
   { $group: {
      _id: "$items.dishId",
      dishName: { $first: "$items.dishName" },
      totalQuantity: { $sum: "$items.quantity" }
   }},
   { $sort: { totalQuantity: -1 } },
   { $limit: 1 }
]);

// Query estesa per intervallo di date
db.orders.aggregate([
   { $match: { 
      creationDate: { 
         $gte: ISODate("2024-06-01"), 
         $lte: ISODate("2024-06-30") 
      } 
   }},
   { $unwind: "$items" },
   { $group: {
      _id: "$items.dishId",
      dishName: { $first: "$items.dishName" },
      totalQuantity: { $sum: "$items.quantity" },
      orderCount: { $sum: 1 }
   }},
   { $sort: { totalQuantity: -1 } },
   { $limit: 1 }
]);
```

**Operatori utilizzati**:
- `$match`: Filtra per intervallo date (versione estesa)
- `$unwind`: Scompone array items in documenti separati
- `$group`: Raggruppa per piatto e somma quantità
- `$sum`: Somma quantità totali
- `$first`: Prende il primo valore per dishName
- `$sort`: Ordina per quantità decrescente
- `$limit`: Restituisce solo il primo risultato
- `$gte`, `$lte`: Confronti per intervallo date

**Spiegazione**: Pipeline complessa che scompone gli ordini, raggruppa per piatto e identifica quello più popolare.

---

## Validazione Schema

Tutte le collezioni implementano validazione JSON Schema per garantire integrità dei dati:

### Validazioni Principali

#### Dishes
- `price` deve essere >= 0
- `category` limitata a valori enum
- `preparationTime` e `calories` devono essere positivi

#### Customers
- `email` deve rispettare pattern email valido
- `addresses` deve contenere almeno un elemento
- Ogni indirizzo deve avere `street`, `city`, `zipCode`

#### Orders
- `status` limitato a valori enum predefiniti
- `customerId` deve essere ObjectId valido
- `items` deve contenere almeno un elemento
- `quantity` e prezzi devono essere positivi

---

## Pattern di Utilizzo e Performance

### Scenari Ottimizzati

1. **Visualizzazione Menu**: Query su `dishes` con filtri per categoria e prezzo
2. **Gestione Ordini**: Lookup efficiente tra ordini e clienti
3. **Storico Cliente**: Recupero rapido ordini per customerId
4. **Analytics**: Aggregazioni per statistiche vendite e popolarità piatti

### Considerazioni di Scalabilità

#### Vantaggi dell'Approccio Ibrido
- **Read Performance**: Embedded data riduce join necessari
- **Write Performance**: Reference evita aggiornamenti in cascata
- **Storage Efficiency**: Evita duplicazioni eccessive
- **Flexibility**: Supporta diversi pattern di query

#### Limitazioni Gestite
- **Document Size**: Monitoraggio dimensioni documenti ordini
- **Index Maintenance**: Gestione ottimale degli indici per performance
- **Data Consistency**: Validazione per mantenere coerenza

---

## Utilizzo di LLM

### Dichiarazione di Utilizzo
**Questo progetto è stato sviluppato con l'assistenza di Claude (Anthropic)**

### Aree di Collaborazione LLM

1. **Progettazione**:
   - Analisi dei requisiti per la scelta tra embedding e reference
   - Generazione Dati di esempio per la compilazione del DB
   - Validazione Schema JSON
   
2. **Implementazione Query**:
   - Gestione indici appropriati

3. **Documentazione**:
   - Strutturazione scala di documentazione tecnica

4. **Best Practices**:
   - Considerazioni di scalabilità

### Contributo Umano
- Definizione requisiti funzionali specifici
- Validazione dell'approccio tecnico
- Testing e verifica funzionalità
- Adattamenti per contesto specifico

### Limitazioni e Verifica
- Tutte le query sono state testate nel contesto MongoDB
- La documentazione riflette implementation effettiva
- I pattern suggeriti seguono MongoDB best practices
- La struttura è ottimizzata per casi d'uso reali

---

## Conclusioni

Il sistema implementato fornisce una base scalabile per la gestione di un servizio di consegna pasti. L'approccio ibrido embedding/reference offre il giusto equilibrio tra performance di lettura e flessibilità di gestione, mentre la validazione schema garantisce integrità dei dati.

Le query implementate soddisfano tutti i requisiti richiesti e possono essere facilmente estese per funzionalità aggiuntive. 

### Punti di Forza
- **Scalabilità**: Struttura preparata per crescita
- **Performance**: Indici ottimizzati per query comuni
- **Integrità**: Validazione rigorosa dei dati
- **Flessibilità**: Facilmente estendibile
- **Manutenibilità**: Documentazione completa


