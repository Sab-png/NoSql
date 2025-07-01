# Requisiti 

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
