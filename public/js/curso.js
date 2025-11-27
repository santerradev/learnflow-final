// file: public/js/curso.js

// Inscrever no curso
async function inscreverNoCurso(cursoId, temSenha) {
    if (temSenha) {
        // Abrir modal de senha
        var modal = document.getElementById('modal-senha-' + cursoId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    } else {
        // Inscrever direto
        await enviarInscricaoSemSenha(cursoId);
    }
}

// Enviar inscrição sem senha
async function enviarInscricaoSemSenha(cursoId) {
    var btn = document.getElementById('btn-inscrever-' + cursoId);
    if (!btn) return;
    
    var btnTexto = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Inscrevendo...';
    
    try {
        var res = await fetch('/cursos/' + cursoId + '/inscrever', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        var data = await res.json();
        
        if (res.ok) {
            alert('Inscrição realizada com sucesso!');
            window.location.reload();
        } else {
            alert(data.error || 'Erro ao inscrever no curso.');
            btn.disabled = false;
            btn.innerHTML = btnTexto;
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor.');
        btn.disabled = false;
        btn.innerHTML = btnTexto;
    }
}

// Enviar inscrição com senha
async function enviarInscricao(event, cursoId) {
    event.preventDefault();
    
    var senha = document.getElementById('senha-curso-' + cursoId).value;
    
    try {
        var res = await fetch('/cursos/' + cursoId + '/inscrever', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha_acesso: senha })
        });
        
        var data = await res.json();
        
        if (res.ok) {
            alert('Inscrição realizada com sucesso!');
            window.location.reload();
        } else {
            alert(data.error || 'Senha incorreta ou erro ao inscrever.');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor.');
    }
}

// Fechar modal de senha
function fecharModalSenha(cursoId) {
    var modal = document.getElementById('modal-senha-' + cursoId);
    if (modal) {
        modal.classList.add('hidden');
    }
}