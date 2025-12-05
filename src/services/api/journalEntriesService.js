import mockData from '@/services/mockData/journalEntries.json';
import journalEntryLinesService from './journalEntryLinesService.js';

let journalEntries = [...mockData];

const journalEntriesService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return journalEntries.map(entry => ({ ...entry }));
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const entry = journalEntries.find(je => je.Id === parseInt(id));
    if (!entry) return null;

    // Get associated journal entry lines
    const lines = await journalEntryLinesService.getByJournalEntryId(id);
    
    return {
      ...entry,
      lines: lines
    };
  },

  create: async (entryData) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Validate that debits equal credits
    const totalDebits = entryData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = entryData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Debits must equal credits');
    }

    // Generate new JE number
    const existingNumbers = journalEntries.map(je => 
      parseInt(je.je_number.replace('JE', ''))
    );
    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    
    const newEntry = {
      Id: Math.max(...journalEntries.map(je => je.Id), 0) + 1,
      je_number: `JE${nextNumber.toString().padStart(3, '0')}`,
      je_date: entryData.je_date,
      description: entryData.description
    };
    
    journalEntries.push(newEntry);

    // Create journal entry lines
    for (const lineData of entryData.lines) {
      await journalEntryLinesService.create({
        ...lineData,
        je_id: newEntry.Id
      });
    }

    return { ...newEntry };
  },

  update: async (id, entryData) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = journalEntries.findIndex(je => je.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Journal entry not found');
    }

    // Validate that debits equal credits
    if (entryData.lines) {
      const totalDebits = entryData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredits = entryData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Debits must equal credits');
      }

      // Delete existing lines and create new ones
      await journalEntryLinesService.deleteByJournalEntryId(id);
      for (const lineData of entryData.lines) {
        await journalEntryLinesService.create({
          ...lineData,
          je_id: parseInt(id)
        });
      }
    }

    journalEntries[index] = {
      ...journalEntries[index],
      je_date: entryData.je_date || journalEntries[index].je_date,
      description: entryData.description || journalEntries[index].description
    };
    
    return { ...journalEntries[index] };
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = journalEntries.findIndex(je => je.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Journal entry not found');
    }
    
    // Delete associated journal entry lines
    await journalEntryLinesService.deleteByJournalEntryId(id);
    
    journalEntries.splice(index, 1);
    return true;
  }
};

export default journalEntriesService;