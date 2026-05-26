// ── Página: Perfil de Membro (visão diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { getPerfilMembro } from '/assets/js/supabase/membros.js';
import { getPresencasMembro } from '/assets/js/supabase/presenca.js';
import { getAulasComEntregasMembro } from '/assets/js/supabase/aulas.js';

const membroId = new URLSearchParams(window.location.search).get('id');
if (!membroId) window.location.replace('/membros/diretoria/membros');

await shell.mount({ activeRoute: '/membros/diretoria/membros', pageTitle: 'Perfil do Membro' });

const $ = (id) => document.getElementById(id);

const ROLE_LABELS = {
  presidente: 'Presidente',
  vp: 'Vice-Presidente',
  ops: 'Operações',
  rh: 'Recursos Humanos',
  diretor: 'Diretor(a)',
  coordenador: 'Coordenador(a)',
  membro: 'Membro',
  trainee: 'Trainee',
};

async function carregar() {
  try {
    const perfil = await getPerfilMembro(membroId);
    if (!perfil) {
      $('perfil-nome').textContent = 'Membro não encontrado';
      return;
    }

    const nome = perfil.nome || 'Membro';
    const ligaNome = perfil.ligas?.nome || '';
    const cor = ligaNome.toLowerCase().includes('ibbot') ? 'r' : 'b';

    $('perfil-av-text').textContent = (nome[0] || 'M').toUpperCase();
    if (perfil.avatar_url) {
      $('perfil-av').innerHTML = `<img src="${perfil.avatar_url}" alt="Avatar de ${nome}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    }

    $('perfil-nome').textContent = nome;
    $('perfil-cargo').textContent = ROLE_LABELS[perfil.cargo] || 'Membro';

    const badge = $('perfil-liga-badge');
    badge.textContent = ligaNome;
    badge.className = `perfil-liga-badge ${cor}`;

    if (perfil.bio) {
      $('perfil-bio').textContent = perfil.bio;
    } else {
      $('perfil-bio').textContent = '—';
      $('perfil-bio').style.color = 'var(--text-tertiary)';
    }

    const linkedinEl = $('perfil-linkedin');
    if (perfil.linkedin) {
      linkedinEl.href = perfil.linkedin.startsWith('http') ? perfil.linkedin : `https://${perfil.linkedin}`;
      linkedinEl.textContent = perfil.linkedin.replace(/^https?:\/\//, '');
      linkedinEl.style.display = '';
    } else {
      linkedinEl.parentElement.style.display = 'none';
    }

    const githubEl = $('perfil-github');
    if (perfil.github) {
      githubEl.href = perfil.github.startsWith('http') ? perfil.github : `https://${perfil.github}`;
      githubEl.textContent = perfil.github.replace(/^https?:\/\//, '');
      githubEl.style.display = '';
    } else {
      githubEl.parentElement.style.display = 'none';
    }

    const [presencas, aulas] = await Promise.all([
      getPresencasMembro(membroId),
      getAulasComEntregasMembro(membroId, perfil.liga_id),
    ]);

    const presentes = presencas.filter(p => p.status === 'presente').length;
    const pct = presencas.length > 0 ? Math.round((presentes / presencas.length) * 100) : 0;
    const aulasComPrazo = aulas.filter(a => a.prazo_entrega);
    const entregues = aulas.filter(a => a.entrega).length;

    $('stat-presenca').textContent = `${pct}%`;
    $('stat-entregas').textContent = `${entregues}/${aulasComPrazo.length}`;
    $('stat-encontros').textContent = presencas.length;

  } catch (e) {
    console.error('Erro ao carregar perfil:', e);
  }
}

carregar();
