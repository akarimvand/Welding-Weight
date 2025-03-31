// Welding Weight Calculator Application

class PipeCalculator {
  constructor() {
    this.pipes = [];
    this.initDOM();
    this.initEventListeners();
  }

  initDOM() {
    this.jTypeSelect = document.getElementById('jType');
    this.nSizeSelect = document.getElementById('nSize');
    this.thicknessSelect = document.getElementById('thickness');
    this.quantityInput = document.getElementById('quantity');
    this.calculationForm = document.getElementById('calculationForm');
    this.resultsSection = document.getElementById('resultsSection');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.historyContainer = document.getElementById('historyContainer');
    this.exportBtn = document.getElementById('exportBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');
    this.whatsappBtn = document.getElementById('whatsappBtn');
  }

  initEventListeners() {
    this.jTypeSelect.addEventListener('change', () => {
      this.updateNSizeOptions();
      this.updateThicknessOptions();
    });
    this.nSizeSelect.addEventListener('change', () => this.updateThicknessOptions());
    this.calculationForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.exportBtn.addEventListener('click', () => this.exportHistory());
    this.clearAllBtn.addEventListener('click', () => this.clearAllHistory());
    this.whatsappBtn.addEventListener('click', () => this.shareOnWhatsApp());
    
    // Handle quantity input focus/blur
    this.quantityInput.addEventListener('focus', () => {
      if (this.quantityInput.value === '1') {
        this.quantityInput.value = '';
      }
    });
    this.quantityInput.addEventListener('blur', () => {
      if (this.quantityInput.value === '') {
        this.quantityInput.value = '1';
      }
    });
  }

  shareOnWhatsApp() {
    if (!this.resultsContainer.hasChildNodes()) {
      return alert('No results to share');
    }
    
    let message = '🔧 Welding Weight Calculation Results:\n\n';
    const resultCards = this.resultsContainer.querySelectorAll('.result-card');
    
    resultCards.forEach(card => {
      const title = card.querySelector('h3').textContent;
      const value = card.querySelector('p.text-2xl').textContent;
      const calculation = card.querySelector('p.text-sm').textContent;
      message += `${title}: ${value}\n${calculation}\n\n`;
    });

    const encodedMessage = encodeURIComponent(message.trim());
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }

  // ... [rest of the existing methods remain exactly the same] ...

  clearAllHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('pipeCalculations');
      this.displayHistory();
    }
  }

  isDuplicateCalculation(newItem, history) {
    return history.some(item => 
      item.jType === newItem.jType &&
      item.nSize === newItem.nSize &&
      item.thickness === newItem.thickness &&
      item.quantity === newItem.quantity
    );
  }

  async loadPipeData() {
    try {
      const response = await fetch('db.txt');
      if (!response.ok) throw new Error('Failed to load pipe data');
      const data = await response.text();
      this.pipes = this.parsePipeData(data);
      this.thicknessSelect.disabled = true;
      this.populateJTypeOptions();
      this.updateNSizeOptions();
      this.updateThicknessOptions();
      this.displayHistory();
    } catch (error) {
      console.error('Error loading pipe data:', error);
      alert('Error: Could not load pipe data');
    }
  }

  parsePipeData(data) {
    const lines = data.split('\n');
    const headers = lines[0].split('\t');
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
  }

  populateJTypeOptions() {
    this.jTypeSelect.innerHTML = '<option value="">Select J Type</option>';
    [...new Set(this.pipes.map(p => p.J_type))]
      .sort()
      .forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        this.jTypeSelect.appendChild(option);
      });
  }

  updateNSizeOptions() {
    this.nSizeSelect.innerHTML = '<option value="">Select N-SIZE</option>';
    const selectedJType = this.jTypeSelect.value;
    const filteredPipes = selectedJType 
      ? this.pipes.filter(p => p.J_type === selectedJType)
      : this.pipes;
      
    [...new Set(filteredPipes.map(p => p['N-SIZE']))]
      .sort((a, b) => a - b)
      .forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        this.nSizeSelect.appendChild(option);
      });
  }

  updateThicknessOptions() {
    this.thicknessSelect.innerHTML = '<option value="">Select Thickness</option>';
    if (!this.nSizeSelect.value) {
      this.thicknessSelect.disabled = true;
      return;
    }
    
    const selectedJType = this.jTypeSelect.value;
    const selectedNSize = this.nSizeSelect.value;
    
    const filteredPipes = this.pipes.filter(p => 
      p['N-SIZE'] === selectedNSize && 
      (!selectedJType || p.J_type === selectedJType)
    );
    
    const thicknesses = [...new Set(filteredPipes.map(p => p.Thk))].sort((a, b) => a - b);
    
    if (thicknesses.length > 0) {
      this.thicknessSelect.disabled = false;
      thicknesses.forEach(thk => {
        const option = document.createElement('option');
        option.value = thk;
        option.textContent = thk;
        this.thicknessSelect.appendChild(option);
      });
    } else {
      this.thicknessSelect.disabled = true;
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const nSize = this.nSizeSelect.value;
    const thickness = this.thicknessSelect.value;
    const quantity = parseFloat(this.quantityInput.value);
    
    if (!nSize || !thickness || !quantity || isNaN(quantity) || quantity <= 0) {
      return alert('Please fill all fields with valid values');
    }

    const pipe = this.pipes.find(p => 
      p['N-SIZE'] === nSize && 
      p.Thk === thickness &&
      (!this.jTypeSelect.value || p.J_type === this.jTypeSelect.value)
    );
    
    if (!pipe) return alert('No pipe found with selected specifications');

    const results = {
      'Filler Ф2#4': (pipe['Filler Ф2#4'] * quantity).toFixed(8),
      'Elec# Ф2#5': (pipe['Elec# Ф2#5'] * quantity).toFixed(8),
      'Elec# Ф3#25': (pipe['Elec# Ф3#25'] * quantity).toFixed(8),
      'Elec# Ф4': (pipe['Elec# Ф4'] * quantity).toFixed(8)
    };

    this.displayResults(pipe, results, quantity);
    this.saveToHistory(pipe, results, quantity);
  }

  displayResults(pipe, results, quantity) {
    this.resultsContainer.innerHTML = '';
    Object.entries(results)
      .filter(([_, val]) => parseFloat(val) > 0)
      .forEach(([key, val]) => {
        const card = document.createElement('div');
        card.className = 'result-card bg-gray-50 p-4 rounded-lg border border-gray-200';
        card.innerHTML = `
          <h3 class="font-semibold text-gray-700">${key}</h3>
          <p class="text-2xl font-bold text-blue-600 mt-2">${val} KG</p>
          <p class="text-sm text-gray-500 mt-1">
            ${pipe[key]} KG/joint × ${quantity} joints = ${val} KG
          </p>`;
        this.resultsContainer.appendChild(card);
      });
    this.resultsSection.classList.remove('hidden');
  }

  saveToHistory(pipe, results, quantity) {
    const history = JSON.parse(localStorage.getItem('pipeCalculations')) || [];
    const newItem = {
      timestamp: new Date().toLocaleString(),
      jType: pipe.J_type,
      nSize: pipe['N-SIZE'],
      thickness: pipe.Thk,
      quantity,
      results
    };

    if (this.isDuplicateCalculation(newItem, history)) {
      if (confirm('This exact calculation already exists in history. Add it again?')) {
        history.unshift(newItem);
        localStorage.setItem('pipeCalculations', JSON.stringify(history));
      }
    } else {
      history.unshift(newItem);
      localStorage.setItem('pipeCalculations', JSON.stringify(history));
    }
    this.displayHistory();
  }

  displayHistory() {
    const history = JSON.parse(localStorage.getItem('pipeCalculations')) || [];
    this.historyContainer.innerHTML = history.length ? '' : 
      '<p class="text-gray-500 text-center py-4">No calculations yet</p>';
    
    history.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2';
      div.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold">${item.jType || 'All'} - ${item.nSize} - ${item.thickness} (Joints: ${item.quantity})</h3>
            <p class="text-sm text-gray-500">${item.timestamp}</p>
          </div>
          <button class="delete-btn text-red-500 hover:text-red-700" data-index="${i}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2">
          ${Object.entries(item.results)
            .filter(([_, v]) => parseFloat(v) > 0)
            .map(([k, v]) => `<div class="text-sm"><span class="font-medium">${k}:</span> ${v} KG</div>`)
            .join('')}
        </div>`;
      this.historyContainer.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const history = JSON.parse(localStorage.getItem('pipeCalculations')) || [];
        history.splice(parseInt(e.target.closest('button').dataset.index), 1);
        localStorage.setItem('pipeCalculations', JSON.stringify(history));
        this.displayHistory();
      });
    });
  }

  exportHistory() {
    const history = JSON.parse(localStorage.getItem('pipeCalculations')) || [];
    if (!history.length) return alert('No history to export');
    
    const csv = [
      'Timestamp,J Type,N-SIZE,Thickness,Joints,Filler Ф2#4 (KG),Elec# Ф2#5 (KG),Elec# Ф3#25 (KG),Elec# Ф4 (KG)',
      ...history.map(item => `"${item.timestamp}",${item.jType || ''},${item.nSize},${item.thickness},${item.quantity},${
        Object.entries(item.results).map(([_,v]) => v || 0).join(',')
      }`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `welding_calculations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  const app = new PipeCalculator();
  app.loadPipeData();
});