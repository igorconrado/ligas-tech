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

  document.getElementById('modal-name').textContent = d.nome;
  document.getElementById('modal-role').textContent = d.cargo;
  document.getElementById('modal-bio').textContent = d.bio || 'Bio em breve.';

  // Define cores baseado na liga
  const isDouble = d.liga === 'w';
  const isRed    = d.liga === 'r';
  const isBlue   = d.liga === 'b';

  // Linha de acento no topo do painel
  const accent = document.getElementById('dmp-accent');
  if (isDouble) {
    accent.style.background = 'linear-gradient(90deg, var(--red) 0%, var(--blue) 100%)';
  } else if (isRed) {
    accent.style.background = 'var(--red)';
  } else {
    accent.style.background = 'var(--blue)';
  }

  // Cor do kicker (nome da liga)
  const kicker = document.getElementById('dmp-kicker');
  kicker.textContent = d.ligaNome;
  if (isDouble) {
    kicker.innerHTML = '<span style="color:var(--red)">IbBot</span> <span style="color:rgba(255,255,255,.2)">&</span> <span style="color:var(--blue)">IbTech</span>';
  } else if (isRed) {
    kicker.style.color = 'var(--red)';
  } else {
    kicker.style.color = 'var(--blue)';
  }

  // Avatar
  const av = document.getElementById('dmp-av');
  av.innerHTML = d.foto ? `<img src="${d.foto}" alt="${d.nome}">` : initial;
  if (isDouble) {
    av.style.background = 'linear-gradient(135deg, rgba(255,31,31,.15) 0%, rgba(15,111,255,.15) 100%)';
    av.style.color = 'var(--text)';
    av.style.border = '1px solid rgba(255,255,255,.12)';
  } else if (isRed) {
    av.style.background = 'rgba(255,31,31,.12)';
    av.style.color = 'var(--red)';
    av.style.border = '1px solid rgba(255,31,31,.2)';
  } else {
    av.style.background = 'rgba(15,111,255,.12)';
    av.style.color = 'var(--blue)';
    av.style.border = '1px solid rgba(15,111,255,.2)';
  }

  // Divisor
  const divider = document.getElementById('dmp-divider');
  if (isDouble) {
    divider.style.background = 'linear-gradient(90deg, var(--red), var(--blue))';
    divider.style.width = '80px';
  } else if (isRed) {
    divider.style.background = 'var(--red)';
    divider.style.width = '40px';
  } else {
    divider.style.background = 'var(--blue)';
    divider.style.width = '40px';
  }

  // Links — classe de cor baseada na liga
  let links = '';
  const linkClass = isDouble ? 'w' : d.liga;
  if (d.linkedin) links += `<a class="dmp-link ${linkClass}" href="${d.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a>`;
  if (d.github)   links += `<a class="dmp-link" href="${d.github}" target="_blank" rel="noopener">GitHub ↗</a>`;
  if (!d.linkedin && !d.github) links = `<span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);letter-spacing:.04em">Links em breve</span>`;
  document.getElementById('dmp-links').innerHTML = links;

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
