# 📋 DOCUMENTAÇÃO COMPLETA DE ROTAS - LEARNFLOW

## 🎯 TODAS AS ROTAS DA API

---

## 🔐 AUTENTICAÇÃO (`/auth`)

| Método | Rota | Descrição | Auth | Body |
|--------|------|-----------|------|------|
| GET | `/auth/login` | Página de login | ❌ | - |
| POST | `/auth/login` | Processar login | ❌ | `email`, `senha` |
| GET | `/auth/cadastro` | Página de cadastro | ❌ | - |
| POST | `/auth/cadastro` | Processar cadastro | ❌ | `nome`, `email`, `senha`, `confirmar_senha`, `tipo`, `instituicao`, `foto_perfil?` |
| GET | `/auth/logout` | Logout | ✅ | - |

---

## 🛡️ ADMINISTRAÇÃO (`/admin`)

| Método | Rota | Descrição | Auth | Permissão |
|--------|------|-----------|------|-----------|
| GET | `/admin/dashboard` | Dashboard admin | ✅ | Admin |
| GET | `/admin/solicitacoes` | Listar solicitações | ✅ | Admin |
| POST | `/admin/solicitacoes/:id/aprovar` | Aprovar solicitação | ✅ | Admin |
| POST | `/admin/solicitacoes/:id/rejeitar` | Rejeitar solicitação | ✅ | Admin |
| GET | `/admin/usuarios` | Listar usuários | ✅ | Admin |
| PUT | `/admin/usuarios/:id/toggle-status` | Ativar/Desativar usuário | ✅ | Admin |
| GET | `/admin/cursos` | Listar cursos | ✅ | Admin |
| DELETE | `/admin/cursos/:id` | Deletar curso | ✅ | Admin |

---

## 📚 CURSOS (`/cursos`)

| Método | Rota | Descrição | Auth | Permissão | Body |
|--------|------|-----------|------|-----------|------|
| GET | `/cursos` | Catálogo de cursos | ✅ | Todos | - |
| GET | `/cursos/meus-cursos` | Meus cursos | ✅ | Todos | - |
| GET | `/cursos/:id` | Detalhes do curso | ✅ | Todos | - |
| POST | `/cursos/:id/inscrever` | Inscrever-se | ✅ | Todos | `senha?` |
| POST | `/cursos` | Criar curso | ✅ | Prof/Admin | `titulo`, `materia`, `descricao?`, `capa_curso?`, `senha_acesso?` |
| PUT | `/cursos/:id` | Editar curso | ✅ | Prof/Admin | `titulo`, `materia`, `descricao?`, `capa_curso?`, `senha_acesso?` |
| DELETE | `/cursos/:id` | Deletar curso | ✅ | Prof/Admin | - |

---

## 🎥 AULAS (`/aulas`)

| Método | Rota | Descrição | Auth | Permissão | Body |
|--------|------|-----------|------|-----------|------|
| GET | `/aulas/lista/:lista_id` | Listar aulas da lista | ✅ | Todos | - |
| GET | `/aulas/:id` | Detalhes da aula (JSON) | ✅ | Todos | - |
| GET | `/aulas/:id/visualizar` | Visualizar aula (VIEW) | ✅ | Todos | - |
| POST | `/aulas` | Criar aula | ✅ | Prof/Admin | `titulo`, `materia`, `descricao`, `lista_id`, `ordem?`, `prazo?`, `capa_aula?`, `video` |
| PUT | `/aulas/:id` | Editar aula | ✅ | Prof/Admin | `titulo`, `materia`, `descricao`, `ordem?`, `prazo?`, `capa_aula?`, `video?` |
| DELETE | `/aulas/:id` | Deletar aula | ✅ | Prof/Admin | - |
| PUT | `/aulas/lista/:lista_id/reordenar` | Reordenar aulas | ✅ | Prof/Admin | `aulas: [{id, ordem}]` |

---

## 📝 ATIVIDADES (`/atividades`)

| Método | Rota | Descrição | Auth | Permissão | Body |
|--------|------|-----------|------|-----------|------|
| GET | `/atividades/lista/:lista_id` | Listar atividades | ✅ | Todos | - |
| GET | `/atividades/:id` | Detalhes (JSON) | ✅ | Todos | - |
| GET | `/atividades/:id/visualizar` | Visualizar (VIEW) | ✅ | Todos | - |
| POST | `/atividades/:id/submeter` | Submeter resposta | ✅ | Aluno | `respostas`, `pontuacao?` |
| POST | `/atividades` | Criar atividade | ✅ | Prof/Admin | `titulo`, `materia`, `conteudo` (JSON), `lista_id`, `ordem?`, `prazo?` |
| PUT | `/atividades/:id` | Editar atividade | ✅ | Prof/Admin | `titulo`, `materia`, `conteudo`, `ordem?`, `prazo?` |
| DELETE | `/atividades/:id` | Deletar atividade | ✅ | Prof/Admin | - |
| PUT | `/atividades/lista/:lista_id/reordenar` | Reordenar | ✅ | Prof/Admin | `atividades: [{id, ordem}]` |

---

## 👥 INSCRIÇÕES (`/inscricoes`)

| Método | Rota | Descrição | Auth | Permissão | Body |
|--------|------|-----------|------|-----------|------|
| POST | `/inscricoes/curso/:curso_id` | Inscrever-se | ✅ | Aluno | `senha?` |
| DELETE | `/inscricoes/curso/:curso_id` | Cancelar inscrição | ✅ | Aluno | - |
| GET | `/inscricoes/minhas` | Minhas inscrições | ✅ | Aluno | - |
| GET | `/inscricoes/curso/:curso_id/status` | Verificar status | ✅ | Todos | - |
| GET | `/inscricoes/curso/:curso_id` | Listar inscrições | ✅ | Prof/Admin | - |
| DELETE | `/inscricoes/curso/:curso_id/aluno/:aluno_id` | Remover aluno | ✅ | Prof/Admin | - |
| GET | `/inscricoes/curso/:curso_id/estatisticas` | Estatísticas | ✅ | Prof/Admin | - |
| GET | `/inscricoes/curso/:curso_id/exportar` | Exportar CSV | ✅ | Prof/Admin | - |

---

## 💬 MURAL (`/mural`)

| Método | Rota | Descrição | Auth | Body |
|--------|------|-----------|------|------|
| POST | `/mural/:id/publicacoes` | Criar publicação | ✅ | `conteudo` |
| PUT | `/mural/publicacoes/:id` | Editar publicação | ✅ | `conteudo` |
| DELETE | `/mural/publicacoes/:id` | Deletar publicação | ✅ | - |
| POST | `/mural/publicacoes/:id/comentarios` | Criar comentário | ✅ | `conteudo` |
| DELETE | `/mural/comentarios/:id` | Deletar comentário | ✅ | - |

---

## 📊 PROGRESSO (`/progresso`)

| Método | Rota | Descrição | Auth | Body |
|--------|------|-----------|------|------|
| POST | `/progresso/aula/:aula_id/concluir` | Marcar aula concluída | ✅ | - |
| POST | `/progresso/atividade/:atividade_id/concluir` | Marcar atividade concluída | ✅ | `pontuacao?` |
| DELETE | `/progresso/:tipo/:id/desmarcar` | Desmarcar conclusão | ✅ | - |
| GET | `/progresso/curso/:curso_id` | Obter progresso | ✅ | - |
| GET | `/progresso/curso/:curso_id/relatorio` | Relatório detalhado | ✅ | - |

---

## 👤 USUÁRIO/PERFIL (`/user`)

| Método | Rota | Descrição | Auth | Body |
|--------|------|-----------|------|------|
| GET | `/user/perfil` | Ver perfil | ✅ | - |
| POST | `/user/perfil/editar` | Editar perfil inline | ✅ | `campo`, `valor` |
| POST | `/user/perfil/foto` | Upload foto | ✅ | `foto_perfil` (file) |
| POST | `/user/perfil/alterar-senha` | Alterar senha | ✅ | `senha_atual`, `nova_senha`, `confirmar_senha` |
| POST | `/user/perfil/desativar` | Desativar conta | ✅ | `senha_confirmacao` |
| GET | `/user/estatisticas` | Estatísticas | ✅ | - |

---

## 🔔 NOTIFICAÇÕES (`/`)

| Método | Rota | Descrição | Auth | Body |
|--------|------|-----------|------|------|
| GET | `/notificacoes` | Página de notificações | ✅ | - |
| GET | `/api/notificacoes` | Listar notificações | ✅ | `?limite=50&page=1` |
| GET | `/api/notificacoes/count` | Contar não lidas | ✅ | - |
| POST | `/api/notificacoes` | Criar notificação | ✅ | `usuario_id`, `tipo`, `titulo`, `mensagem`, `link?`, `curso_id?` |
| PUT | `/api/notificacoes/:id/ler` | Marcar como lida | ✅ | - |
| PUT | `/api/notificacoes/ler-todas` | Marcar todas lidas | ✅ | - |
| DELETE | `/api/notificacoes/:id` | Deletar notificação | ✅ | - |
| DELETE | `/api/notificacoes/limpar-lidas` | Limpar lidas | ✅ | - |

---

## 📄 PÁGINAS GERAIS

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/` | Landing page | ❌ |
| GET | `/inicio` | Dashboard | ✅ |
| GET | `/buscar?q=termo` | Busca global | ✅ |
| GET | `/sobre` | Sobre a plataforma | ❌ |
| GET | `/contato` | Página de contato | ❌ |
| POST | `/contato` | Enviar contato | ❌ |

---

## 📊 RESUMO DE ENDPOINTS:

| Módulo | Quantidade |
|--------|------------|
| Autenticação | 5 |
| Administração | 8 |
| Cursos | 7 |
| Aulas | 7 |
| Atividades | 8 |
| Inscrições | 8 |
| Mural | 5 |
| Progresso | 5 |
| Usuário/Perfil | 6 |
| Notificações | 8 |
| Páginas Gerais | 6 |
| **TOTAL** | **73 ENDPOINTS** |

---

## 🔐 NÍVEIS DE PERMISSÃO:

- ❌ **Público** - Sem autenticação
- ✅ **Autenticado** - Qualquer usuário logado
- 👨‍🏫 **Professor** - Tipo 'professor'
- 🛡️ **Admin** - Tipo 'administrador'
- 👨‍🏫/🛡️ **Prof/Admin** - Professor OU Administrador

---

## 📝 EXEMPLOS DE USO:

### Criar Curso:
```javascript
POST /cursos
Content-Type: multipart/form-data

{
  "titulo": "JavaScript Avançado",
  "materia": "Programação",
  "descricao": "Curso completo de JS",
  "senha_acesso": "JS123",
  "capa_curso": [arquivo]
}
```

### Inscrever-se:
```javascript
POST /cursos/5/inscrever
Content-Type: application/json

{
  "senha": "JS123"
}
```

### Criar Aula:
```javascript
POST /aulas
Content-Type: multipart/form-data

{
  "titulo": "Introdução ao React",
  "materia": "React",
  "descricao": "Conceitos básicos",
  "lista_id": 3,
  "ordem": 1,
  "capa_aula": [arquivo],
  "video": [arquivo]
}
```

### Marcar Aula Concluída:
```javascript
POST /progresso/aula/12/concluir
```

### Obter Notificações:
```javascript
GET /api/notificacoes?limite=20&page=1

Response:
{
  "success": true,
  "notificacoes": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

## 🚨 CÓDIGOS DE STATUS HTTP:

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Erro de validação
- **401** - Não autenticado
- **403** - Sem permissão
- **404** - Não encontrado
- **500** - Erro do servidor

---

## 📦 FORMATO DE RESPOSTA JSON:

### Sucesso:
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

### Erro:
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "error": "Detalhes do erro (apenas em dev)"
}
```

---

**🎉 Sistema completo com 73 endpoints REST!**