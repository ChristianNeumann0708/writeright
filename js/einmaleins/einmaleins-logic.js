import { EinmaleinsStorage } from "./einmaleins-storage.js";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const EinmaleinsLogic = {
  // Generiert alle moeglichen 100 Aufgaben (bzw. fuer die gewaehlten Reihen)
  generateTasks(reihen, typeFilter) {
    let tasks = [];
    
    // For each chosen reihe (1-10)
    for (const reihe of reihen) {
      for (let factor = 1; factor <= 10; factor++) {
        
        // Let's decide how to display. Randomize order or not?
        // Let's randomly display "reihe x factor" or "factor x reihe" for variety if mult.
        // Actually for tracking we use reihe and factor.
        
        if (typeFilter === 'mult' || typeFilter === 'mixed') {
          tasks.push({
            id: `${reihe}_${factor}_mult`,
            reihe: reihe,
            factor: factor,
            taskType: 'mult',
            question: `${reihe} x ${factor} = ?`,
            answer: reihe * factor
          });
        }
        
        if (typeFilter === 'div' || typeFilter === 'mixed') {
          // For division in "reihe", typically it means division by the reihe.
          // e.g. 3er Reihe: 3:3, 6:3, ..., 30:3
          const dividend = reihe * factor;
          const divisor = reihe;
          tasks.push({
            id: `${reihe}_${factor}_div`,
            reihe: reihe,
            factor: factor,
            taskType: 'div',
            question: `${dividend} : ${divisor} = ?`,
            answer: factor
          });
        }
      }
    }
    
    return tasks;
  },

  // Holt Statistik (damit das UI sie anzeigen kann etc.)
  getStats(reihe, factor) {
    return EinmaleinsStorage.getStats(reihe, factor);
  },

  // Generiert ein Training Set basierend auf den Settings
  generateTraining(settings) {
    let tasks = this.generateTasks(settings.reihen, settings.type);
    
    // 1. Nur schwierige?
    if (settings.onlyHard) {
      tasks = tasks.filter(t => {
        const stats = EinmaleinsStorage.getStats(t.reihe, t.factor)[t.taskType];
        if (settings.hardModeType === 'errors') {
          return stats.wrong > 0;
        } else if (settings.hardModeType === 'balance') {
          return stats.wrong > stats.correct;
        }
        return false;
      });
    }

    if (tasks.length === 0) {
      return []; // Kein passendes Set möglich
    }

    shuffleArray(tasks);

    // 2. Modus anwenden
    if (settings.mode === 'once') {
        // Schon alles gewürfelt, zurückgeben
        return tasks;
    } else if (settings.mode === 'count') {
        const count = settings.count;
        let selected = [];
        // Endlos wiederholen bis Count voll ist, falls wir weniger Basisaufgaben als Count haben
        while(selected.length < count) {
            let pool = [...tasks];
            shuffleArray(pool);
            // Smart mixing logic: weight the ones with more mistakes higher
            pool.sort((a, b) => {
                const sA = EinmaleinsStorage.getStats(a.reihe, a.factor)[a.taskType];
                const sB = EinmaleinsStorage.getStats(b.reihe, b.factor)[b.taskType];
                const diffA = sA.wrong - sA.correct;
                const diffB = sB.wrong - sB.correct;
                // Add some randomness
                if (Math.random() > 0.3) {
                   return diffB - diffA; // higher diff (worse) first
                }
                return 0; // random
            });
            for (let t of pool) {
                if (selected.length < count) {
                    selected.push({...t, instanceId: Math.random().toString(36).substring(7)});
                } else break;
            }
        }
        return selected;
    } else if (settings.mode === 'time' || settings.mode === 'all') {
        // Wir geben hier einfach die gemischte Liste zurück
        // Die UI regelt das "endlose" nachziehen von Aufgaben
        return tasks;
    }
    
    return tasks;
  },

  // Hilfsfunktion: generiert 3 falsche Varianten fürs Multiple Choice
  generateMultipleChoiceOptions(task) {
    const answer = parseInt(task.answer, 10);
    let options = new Set([answer]);
    
    // Hole alte Fehler aus Historie
    const stats = EinmaleinsStorage.getStats(task.reihe, task.factor)[task.taskType];
    for (const h of stats.history) {
      if (options.size < 4 && !isNaN(parseInt(h, 10))) {
        options.add(parseInt(h, 10));
      }
    }
    
    // Fülle auf bis 4
    let range = task.taskType === 'mult' ? 20 : 5;
    let fallbackOffset = 1;
    let isPositiveOffset = true;
    while (options.size < 4) {
      let offset = isPositiveOffset ? fallbackOffset : -fallbackOffset;
      // Entweder zufällig z.B. +- 1, 2, ... mal faktor
      let fake = answer + offset * task.reihe;
      
      if (fake > 0 && !options.has(fake)) {
         options.add(fake);
      } else {
         // nochmal komplett random versuchen wenn +reihe nicht klappt
         fake = answer + (Math.floor(Math.random() * range) - (range/2));
         if (fake > 0 && !options.has(fake)) {
           options.add(fake);
         }
      }
      
      if (!isPositiveOffset) fallbackOffset++;
      isPositiveOffset = !isPositiveOffset;
    }
    
    // Set to Array and shuffle
    let optArray = Array.from(options);
    shuffleArray(optArray);
    return optArray;
  }
};
