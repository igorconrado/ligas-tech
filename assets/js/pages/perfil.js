// ── Página: Meu Perfil (membro e diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { getMeuPerfil, atualizarPerfil, uploadAvatar } from '/assets/js/supabase/membros.js';
import { getMinhasPresencas } from '/assets/js/supabase/presenca.js';
import { getAulasComEntregas } from '/assets/js/supabase/aulas.js';
import { toast } from '/assets/js/ui/toast.js';

const pathname = window.location.pathname;
const activeRoute = pathname.includes('/diretoria/') ? '/membros/diretoria/perfil' : '/membros/perfil';
const { session } = await shell.mount({ activeRoute, pageTitle: 'Meu Perfil' });

const $ = (id) => document.getElementById(id);

const ROLE_LABELS = {
  presidente: 'Presidente',
  vp: 'Vice-Presidente',
  ops: 'Operações',
  rh: 'Recursos Humanos',
  diretor: 'Diretor(a)',
  coordenador: 'Coordenador(a)',
  membro: 'Membro',
};

function ligaCor(perfil) {
  const nome = perfil?.ligas?.nome?.toLowerCase() || '';
  if (nome.includes('ibbot')) return 'r';
  if (nome.includes('ibtech')) return 'b';
  return 'w';
}

function setAvatar(url, inicial) {
  const av = $('perfil-av');
  if (!av) return;
  if (url) {
    av.innerHTML = `<img src="${url}" alt="Avatar">`;
  } else {
    av.innerHTML = `<span id="perfil-av-text">${inicial}</span>`;
  }
}

async function carregar() {
  const perfil = await getMeuPerfil();
  if (!perfil) return;

  const nome = perfil.nome || 'Membro';
  const inicial = nome[0]?.toUpperCase() || 'M';
  const ligaNome = perfil.ligas?.nome || '';
  const cor = ligaCor(perfil);

  $('perfil-name-display').textContent = nome;
  const roleEl = $('perfil-role-display');
  if (roleEl) roleEl.textContent = ROLE_LABELS[perfil.role] || perfil.role || 'Membro';
  setAvatar(perfil.avatar_url, inicial);
  $('p-nome').value = nome;
  $('p-linkedin').value = perfil.linkedin || '';
  $('p-github').value = perfil.github || '';
  $('p-bio').value = perfil.bio || '';
  $('perfil-email').value = session.user.email;

  const badge = $('perfil-liga-badge');
  badge.textContent = ligaNome;
  badge.className = `perfil-liga-badge ${cor}`;

  // Stats (reusa queries já existentes)
  try {
    const [presencas, aulas] = await Promise.all([
      getMinhasPresencas(),
      getAulasComEntregas(),
    ]);
    const presentes = presencas.filter(p => p.status === 'presente').length;
    const pct = presencas.length > 0 ? Math.round((presentes / presencas.length) * 100) : 0;
    const aulasComPrazo = aulas.filter(a => a.prazo_entrega);
    const entregues = aulas.filter(a => a.entrega).length;
    $('perfil-stat-presenca').textContent = `${pct}%`;
    $('perfil-stat-entregas').textContent = `${entregues}/${aulasComPrazo.length}`;
  } catch (e) {
    console.error('Erro ao carregar stats do perfil:', e);
  }
}

async function savePerfil() {
  const btn = $('btn-salvar-perfil');
  const texto = $('btn-salvar-texto');
  if (!btn || !texto) return;

  const nome = $('p-nome').value.trim();
  if (!nome) {
    toast.error('O nome não pode estar vazio');
    return;
  }

  btn.disabled = true;
  texto.textContent = 'SALVANDO...';

  try {
    await atualizarPerfil({
      nome,
      linkedin: $('p-linkedin').value.trim() || null,
      github: $('p-github').value.trim() || null,
      bio: $('p-bio').value.trim() || null,
    });
    texto.textContent = '✓ SALVO';
    btn.style.background = 'var(--green)';
    toast.success('Perfil atualizado');
    setTimeout(() => {
      texto.textContent = 'SALVAR →';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  } catch (e) {
    texto.textContent = 'ERRO';
    btn.style.background = 'var(--red)';
    toast.error(e.message || 'Erro ao salvar perfil');
    setTimeout(() => {
      texto.textContent = 'SALVAR →';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  }
}

document.getElementById('btn-salvar-perfil')?.addEventListener('click', savePerfil);

document.getElementById('input-avatar')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) {
    toast.error('Imagem muito grande. Máximo: 2 MB');
    e.target.value = '';
    return;
  }

  try {
    const url = await uploadAvatar(file);
    setAvatar(url, '');
    toast.success('Foto atualizada');
  } catch (err) {
    toast.error(err.message || 'Erro ao enviar foto');
  } finally {
    e.target.value = '';
  }
});

carregar();
