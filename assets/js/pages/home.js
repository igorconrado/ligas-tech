// ── Home page (index.html) ──
import { animateCounters } from '/assets/js/components/counter.js';

// Contadores animados
animateCounters({ n1: 26, n2: 2, n3: 9, n4: 5, n5: 1 }, 1400, 400);

// Dados da diretoria — agrupados por cúpula
const diretoria = [
  {
    grupo: 'Alta Cúpula',
    membros: [
      { nome: 'Joshua', cargo: 'Acadêmico' },
      { nome: 'Julia', cargo: 'Relações Internas' },
      { nome: 'Beatriz', cargo: 'Relações Externas' },
    ],
  },
  {
    grupo: 'Baixa Cúpula',
    membros: [
      { nome: 'Isaac', cargo: 'Marketing' },
      { nome: 'Pedro', cargo: 'Operações' },
    ],
  },
  {
    grupo: 'Conselheiros',
    membros: [
      { nome: 'Marcos', cargo: 'Conselheiro' },
      { nome: 'Igor', cargo: 'Conselheiro' },
      { nome: 'Tulio', cargo: 'Conselheiro' },
    ],
  },
];

// Renderiza grupos
const wrap = document.getElementById('dir-groups');
diretoria.forEach(g => {
  const membrosHtml = g.membros.map(m => `
    <div class="dir-card">
      <div class="dir-name">${m.nome}</div>
      <div class="dir-role">${m.cargo}</div>
    </div>`).join('');
  wrap.innerHTML += `
    <div class="dir-group">
      <div class="dir-group-title">${g.grupo}</div>
      <div class="dir-group-grid">${membrosHtml}</div>
    </div>`;
});
