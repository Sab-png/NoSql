# Consegna Finale

## Panoramica del Sistema

Il sistema di gestione per il servizio di consegna pasti è progettato per supportare le operazioni di un'azienda di cucine centralizzate che offre consegne a domicilio. Il database MongoDB `foodDeliveryDB` gestisce tre entità principali:

- **Piatti**: Catalog dei prodotti disponibili
- **Clienti**: Anagrafica clienti con indirizzi di consegna
- **Ordini**: Gestione degli ordini con dettagli di consegna

---

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

## Estensioni Possibili

### Funzionalità Aggiuntive
1. **Sistema Rating**: Recensioni clienti per piatti
2. **Gestione Promozioni**: Sconti e offerte speciali
3. **Tracking Consegne**: Stati dettagliati della consegna
4. **Gestione Inventory**: Disponibilità ingredienti
5. **Sistema Notifiche**: Aggiornamenti stato ordine

### Ottimizzazioni Future
1. **Sharding**: Partizionamento per scalabilità geografica
2. **Time Series**: Collezioni separate per dati analitici
3. **Caching**: Redis per dati frequentemente accessibili
4. **Search**: MongoDB Atlas Search per ricerca full-text

---

### Operazioni Comuni

#### Aggiunta Nuovo Piatto
```javascript
db.dishes.insertOne({
   name: "Risotto al Nero di Seppia",
   description: "Risotto cremoso con nero di seppia",
   price: 19.50,
   category: "primo",
   preparationTime: 30,
   calories: 420,
   isActive: true
});
```

#### Registrazione Nuovo Cliente
```javascript
db.customers.insertOne({
   firstName: "Anna",
   lastName: "Verdi",
   email: "anna.verdi@email.com",
   registrationDate: new Date(),
   addresses: [{
      street: "Via Milano 456",
      city: "Torino",
      zipCode: "10100",
      isDefault: true
   }]
});
```

#### Creazione Nuovo Ordine
```javascript
db.orders.insertOne({
   customerId: ObjectId("..."),
   creationDate: new Date(),
   status: "in preparazione",
   items: [{
      dishId: ObjectId("..."),
      dishName: "Risotto ai Funghi Porcini",
      quantity: 2,
      unitPrice: 18.50,
      totalPrice: 37.00
   }],
   deliveryAddress: {
      street: "Via Milano 456",
      city: "Torino",
      zipCode: "10100"
   },
   totalAmount: 37.00
});
```
---

## Utilizzo di LLM

### Dichiarazione di Utilizzo
**Questo progetto è stato sviluppato con l'assistenza di Claude (Anthropic)**

### Aree di Collaborazione LLM

1. **Progettazione Schema**:
   - Analisi dei requisiti per determinare embedding vs reference
   - Definizione validazioni JSON Schema

2. **Implementazione Query**:
   - Gestione indici appropriati

3. **Documentazione**:
   - Strutturazione documentazione tecnica

4. **Best Practices**:
   - Pattern MongoDB per applicazioni reali
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

Il sistema implementato fornisce una base solida e scalabile per la gestione di un servizio di consegna pasti. L'approccio ibrido embedding/reference offre il giusto equilibrio tra performance di lettura e flessibilità di gestione, mentre la validazione schema garantisce integrità dei dati.

Le query implementate soddisfano tutti i requisiti richiesti e possono essere facilmente estese per funzionalità aggiuntive. 

### Punti di Forza
- **Scalabilità**: Struttura preparata per crescita
- **Performance**: Indici ottimizzati per query comuni
- **Integrità**: Validazione rigorosa dei dati
- **Flessibilità**: Facilmente estendibile
- **Manutenibilità**: Documentazione completa

