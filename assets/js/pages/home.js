// ── Home page (index.html) ──
import { animateCounters } from '/assets/js/components/counter.js';

// Contadores animados
animateCounters({ n1: 26, n2: 2, n3: 9, n4: 5, n5: 1 }, 1400, 400);

// Dados da diretoria
// Para adicionar foto: coloque o caminho da imagem em "foto"
// Para adicionar bio, LinkedIn e GitHub: preencha os campos abaixo
const diretoria = [
  { nome: 'Igor', cargo: 'Presidente', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: 'Presidente das ligas IbBot e IbTech. Co-fundador da Vecto. Engenharia de Software — Ibmec BH.', linkedin: 'https://linkedin.com/in/', github: 'https://github.com/' },
  { nome: 'Joshua', cargo: 'Vice-Presidente', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Marcelo', cargo: 'Parcerias', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Tulio', cargo: 'Eventos', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Júlia', cargo: 'Recursos Humanos', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Isaac', cargo: 'Marketing', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Pedro', cargo: 'Operações', liga: 'w', ligaNome: 'IbBot & IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'Beatriz', cargo: 'Diretora IbTech', liga: 'b', ligaNome: 'IbTech', foto: null, bio: '', linkedin: '', github: '' },
  { nome: 'A definir', cargo: 'Diretor IbBot', liga: 'r', ligaNome: 'IbBot', foto: null, bio: 'Cargo em aberto. Processo seletivo em andamento.', linkedin: '', github: '' },
];

// Renderiza cards
const wrap = document.getElementById('dir-wrap');
diretoria.forEach((d, i) => {
  const initial = d.nome === 'A definir' ? '?' : d.nome[0];
  wrap.innerHTML += `
    <div class="dir-card" onclick="openModal(${i})" style="cursor:pointer">
      <div class="dir-av ${d.liga}">
        ${d.foto ? `<img src="${d.foto}" alt="${d.nome}">` : initial}
      </div>
      <div>
        <div class="dir-name">${d.nome}</div>
        <div class="dir-role">${d.cargo}</div>
        <div class="dir-liga-badge ${d.liga}">${d.ligaNome}</div>
        ${d.nome === 'A definir' ? `<a class="dir-vaga-link" href="/processo-seletivo" onclick="event.stopPropagation()">Vaga em aberto →</a>` : ''}
      </div>
    </div>`;
});

// Modal da diretoria (usa #dir-modal — padrão diferente do modal-overlay)
function openModal(i) {
  const d = diretoria[i];
  const initial = d.nome === 'A definir' ? '?' : d.nome[0];
  document.getElementById('modal-av').innerHTML = d.foto
    ? `<img src="${d.foto}" alt="${d.nome}">`
    : initial;
  document.getElementById('modal-av').className = `modal-av ${d.liga}`;
  document.getElementById('modal-name').textContent = d.nome;
  document.getElementById('modal-role').textContent = d.cargo;
  document.getElementById('modal-liga').textContent = d.ligaNome;
  document.getElementById('modal-liga').className = `modal-liga ${d.liga}`;
  document.getElementById('modal-bio').textContent = d.bio || 'Bio em breve.';

  let links = '';
  if (d.linkedin) links += `<a class="modal-link b" href="${d.linkedin}" target="_blank">LinkedIn ↗</a>`;
  if (d.github)   links += `<a class="modal-link" href="${d.github}" target="_blank">GitHub ↗</a>`;
  if (!d.linkedin && !d.github) links = `<span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Links em breve</span>`;
  document.getElementById('modal-links').innerHTML = links;

  document.getElementById('dir-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('dir-modal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Expõe pro onclick inline
window.openModal = openModal;
window.closeModal = closeModal;
