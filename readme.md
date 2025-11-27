# 📚 Documentação Completa das Rotas - LearnFlow

## 🔐 Autenticação (`/auth`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/auth/login` | Página de login | Não |
| GET | `/auth/cadastro` | Página de cadastro | Não |
| POST | `/auth/login` | Processa login | Não |
| POST | `/auth/cadastro` | Processa cadastro | Não |
| POST | `/auth/logout` | Faz logout | Sim |
| GET | `/auth/logout` | Faz logout (alt) | Sim |

---

## 👤 Usuário (`/user`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/user/perfil` | Página de perfil | Sim |
| PATCH | `/user/perfil` | Atualiza perfil (API) | Sim |
| POST | `/user/perfil` | Atualiza perfil (Form) | Sim |

---

## 👨‍💼 Admin (`/admin`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/admin/estatisticas` | Dashboard admin | Admin |
| GET | `/admin/usuarios` | Lista usuários | Admin |
| GET | `/admin/solicitacoes` | Lista solicitações | Admin |
| GET | `/admin/usuarios/:id/editar` | Form editar usuário | Admin |
| POST | `/admin/usuarios/:id/editar` | Atualiza usuário | Admin |
| POST | `/admin/usuarios/:id/deletar` | Deleta usuário | Admin |
| POST | `/admin/solicitacoes/:id/aprovar` | Aprova professor | Admin |

---

## 📚 Cursos (`/cursos`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/cursos` | Lista todos os cursos | Sim |
| GET | `/cursos/novo` | Form criar curso | Prof/Admin |
| GET | `/cursos/:id/editar` | Form editar curso | Prof/Admin |
| POST | `/cursos/novo` | Cria curso | Prof/Admin |
| POST | `/cursos/:id/editar` | Atualiza curso | Prof/Admin |
| POST | `/cursos/:id/deletar` | Deleta curso | Prof/Admin |

---

## 🎥 Aulas (`/cursos/:cursoId/aulas`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/cursos/:cursoId/aulas` | Lista aulas | Sim |
| GET | `/cursos/:cursoId/aulas/:aulaId` | Detalhes da aula | Sim |
| POST | `/cursos/:cursoId/aulas` | Cria aula | Prof/Admin |
| PUT | `/cursos/:cursoId/aulas/:aulaId` | Atualiza aula | Prof/Admin |
| DELETE | `/cursos/:cursoId/aulas/:aulaId` | Deleta aula | Prof/Admin |
| POST | `/cursos/:cursoId/aulas/:aulaId/editar` | Atualiza (form) | Prof/Admin |
| POST | `/cursos/:cursoId/aulas/:aulaId/deletar` | Deleta (form) | Prof/Admin |

---

## ✏️ Atividades (`/cursos/:cursoId/atividades`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/cursos/:cursoId/atividades` | Lista atividades | Sim |
| GET | `/cursos/:cursoId/atividades/:atividadeId` | Detalhes atividade | Sim |
| POST | `/cursos/:cursoId/atividades` | Cria atividade | Prof/Admin |
| PUT | `/cursos/:cursoId/atividades/:atividadeId` | Atualiza atividade | Prof/Admin |
| DELETE | `/cursos/:cursoId/atividades/:atividadeId` | Deleta atividade | Prof/Admin |
| POST | `/cursos/:cursoId/atividades/:atividadeId/editar` | Atualiza (form) | Prof/Admin |
| POST | `/cursos/:cursoId/atividades/:atividadeId/deletar` | Deleta (form) | Prof/Admin |

---

## 📊 Progresso (`/progresso`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/progresso` | Todo progresso do aluno | Sim (Aluno) |
| GET | `/progresso/meu` | Todo progresso (alt) | Sim (Aluno) |
| GET | `/progresso/cursos/:cursoId` | Progresso em curso | Sim (Aluno) |
| POST | `/progresso/aulas/:aulaId/concluir` | Marca aula concluída | Sim (Aluno) |
| POST | `/progresso/atividades/:atividadeId/submeter` | Submete atividade | Sim (Aluno) |

---

## 🎓 Inscrições (`/inscricoes`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/inscricoes` | Lista inscrições | Sim |
| POST | `/inscricoes/:cursoId` | Inscrever em curso | Sim |
| DELETE | `/inscricoes/:cursoId` | Cancelar inscrição | Sim |
| POST | `/inscricoes/:cursoId/cancelar` | Cancelar (form) | Sim |

---

## 🏠 Páginas Principais

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/` | Landing page | Não |
| GET | `/inicio` | Dashboard principal | Sim |

---

## 🔑 Legendas de Autenticação

- **Não**: Rota pública
- **Sim**: Requer login
- **Prof/Admin**: Requer ser Professor ou Administrador
- **Admin**: Requer ser Administrador
- **Aluno**: Específico para alunos (mas qualquer usuário logado pode acessar)

---

## 📝 Notas Importantes

1. **Rotas com formulários**: As rotas com método POST são para formulários HTML tradicionais
2. **Rotas API**: As rotas com PUT/DELETE/PATCH são para uso via JavaScript (fetch/axios)
3. **Parâmetros**:
   - `:cursoId` - ID do curso
   - `:aulaId` - ID da aula
   - `:atividadeId` - ID da atividade
   - `:id` - ID genérico (usuário, solicitação, etc)

4. **Flash Messages**: A maioria das rotas POST usa flash messages para feedback
5. **Redirecionamentos**: Sucesso redireciona, erro renderiza com mensagem