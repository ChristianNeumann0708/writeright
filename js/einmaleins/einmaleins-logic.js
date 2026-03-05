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
            question: `${factor} x ${reihe} = ?`,
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

  computeWeight(stats) {
    let wrong = stats.wrong || 0;
    let correct = stats.correct || 0;
    
    // Unbekannte Aufgaben (nie geübt): mittlere bis hohe Wichtigkeit
    if (correct === 0 && wrong === 0) return 30;
    
    // Problemfälle: hohe Priorität je nach Fehler-Überschuss
    if (wrong > correct) return 100 + (wrong - correct) * 10;
    
    // Noch in der Lernphase (< 3 mal richtig): leicht erhöhte Priorität
    if (correct < 3) return 15;
    
    // Sitzt sehr sicher: kaum Priorität (nur noch für seltene Auffrischung)
    return 1;
  },

  weightedSampleSequence(tasks) {
    let pool = tasks.map(t => {
       const stats = EinmaleinsStorage.getStats(t.reihe, t.factor)[t.taskType];
       return { task: t, weight: this.computeWeight(stats) };
    });
    let result = [];
    
    while (pool.length > 0) {
        let totalWeight = pool.reduce((sum, el) => sum + el.weight, 0);
        let random = Math.random() * totalWeight;
        let current = 0;
        
        for (let j = 0; j < pool.length; j++) {
            current += pool[j].weight;
            if (current >= random) {
                result.push(pool[j].task);
                pool.splice(j, 1);
                break;
            }
        }
    }
    return result;
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

    // 2. Modus anwenden und sortieren/mischen
    if (settings.mode === 'once') {
        // Einmaliger Durchlauf: Einfach gut mischen, aber jedes exakt 1x!
        shuffleArray(tasks);
        return tasks;
    } else {
        // count, time, all (Endlos): Smarte Sortierung (gewichtet mit Lotterie-Topf)
        tasks = this.weightedSampleSequence(tasks);
        
        // Nach der smarten Auswahl noch einmal leicht durchmischen, damit die Schwersten
        // nicht IMMER am Anfang als Block kommen, sondern etwas natürlicher verteilt sind.
        shuffleArray(tasks);
        
        if (settings.mode === 'count') {
            const count = settings.count;
            let selected = [];
            // Endlos nachfüllen bis Count voll ist
            while(selected.length < count) {
                for (let t of tasks) {
                    if (selected.length < count) {
                        selected.push({...t, instanceId: Math.random().toString(36).substring(7)});
                    } else break;
                }
                // Wenn wir noch nicht voll sind, die tasks für die nächste Runde neu mixen
                if (selected.length < count) {
                   tasks = this.weightedSampleSequence(tasks);
                   shuffleArray(tasks);
                }
            }
            return selected;
        } else if (settings.mode === 'time' || settings.mode === 'all') {
            // Endlos (Zeit/All): Die UI regelt das Nachziehen von Aufgaben, 
            // wir geben einfach die erste smarte Rutsche zurück.
            return tasks;
        }
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
