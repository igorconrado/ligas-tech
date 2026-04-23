// ── Página: Meu Perfil (membro e diretoria) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getMeuPerfil, atualizarPerfil } from '/assets/js/supabase/membros.js';
import { getMinhasPresencas } from '/assets/js/supabase/presenca.js';
import { getAulasComEntregas } from '/assets/js/supabase/aulas.js';
import { toast } from '/assets/js/ui/toast.js';

const { session } = await initPage({ requireRole: 'any' });

const $ = (id) => document.getElementById(id);

function ligaCor(perfil) {
  const nome = perfil?.ligas?.nome?.toLowerCase() || '';
  if (nome.includes('ibbot')) return 'r';
  if (nome.includes('ibtech')) return 'b';
  return 'w';
}

async function carregar() {
  const perfil = await getMeuPerfil();
  if (!perfil) return;

  const nome = perfil.nome || 'Membro';
  const inicial = nome[0]?.toUpperCase() || 'M';
  const ligaNome = perfil.ligas?.nome || '';
  const cor = ligaCor(perfil);

  $('perfil-name-display').textContent = nome;
  $('perfil-av-text').textContent = inicial;
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

  btn.disabled = true;
  texto.textContent = 'SALVANDO...';

  try {
    await atualizarPerfil({
      nome: $('p-nome').value.trim(),
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

window.savePerfil = savePerfil;
carregar();
