import mockData from '@/services/mockData/journalEntryLines.json';

let journalEntryLines = [...mockData];

const journalEntryLinesService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return journalEntryLines.map(line => ({ ...line }));
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const line = journalEntryLines.find(jel => jel.Id === parseInt(id));
    return line ? { ...line } : null;
  },

  getByJournalEntryId: async (jeId) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return journalEntryLines
      .filter(line => line.je_id === parseInt(jeId))
      .map(line => ({ ...line }));
  },

  create: async (lineData) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate new line ID
    const maxLineId = Math.max(...journalEntryLines.map(jel => jel.je_line_id), 0);
    
    const newLine = {
      Id: Math.max(...journalEntryLines.map(jel => jel.Id), 0) + 1,
      je_line_id: maxLineId + 1,
      je_id: lineData.je_id,
      account_id: lineData.account_id,
      debit: parseFloat(lineData.debit || 0),
      credit: parseFloat(lineData.credit || 0)
    };
    
    journalEntryLines.push(newLine);
    return { ...newLine };
  },

  update: async (id, lineData) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = journalEntryLines.findIndex(jel => jel.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Journal entry line not found');
    }
    
    journalEntryLines[index] = {
      ...journalEntryLines[index],
      account_id: lineData.account_id || journalEntryLines[index].account_id,
      debit: parseFloat(lineData.debit || journalEntryLines[index].debit),
      credit: parseFloat(lineData.credit || journalEntryLines[index].credit)
    };
    
    return { ...journalEntryLines[index] };
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = journalEntryLines.findIndex(jel => jel.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Journal entry line not found');
    }
    
    journalEntryLines.splice(index, 1);
    return true;
  },

  deleteByJournalEntryId: async (jeId) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    journalEntryLines = journalEntryLines.filter(line => line.je_id !== parseInt(jeId));
    return true;
  }
};

export default journalEntryLinesService;