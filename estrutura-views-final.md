# 🎨 ESTRUTURA FINAL DE VIEWS - LEARNFLOW

## 📋 Stack Tecnológica
- **Backend**: Node.js + Express + Prisma ORM + MySQL
- **Frontend**: EJS + Tailwind CSS + JavaScript
- **Design**: Responsivo (Desktop & Mobile)
- **Tema**: Light/Dark Mode

---

## 🎨 DESIGN BASEADO NOS PRINTS

### **Cores da Paleta (do Print 1)**
```css
/* Teal Principal */
--teal-primary: #14b8a6;  /* teal-500 */
--teal-dark: #0d9488;     /* teal-600 */
--teal-light: #5eead4;    /* teal-300 */
--teal-bg: #f0fdfa;       /* teal-50 */

/* Cinzas */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### **Sidebar (Tela 6)**
```
PRINCIPAL
🏠 Início
📚 Meus Cursos
💬 Chat

ADMIN (só para administradores)
📊 Dashboard
👥 Usuários
📝 Solicitações

CONTA
👤 Perfil
🔔 Notificações
⚙️ Configurações

[Avatar + Nome + Email no rodapé]
```

### **Navbar Superior**
- Logo "LearnFlow" (esquerda)
- Ícones de navegação (centro)
- Theme toggle (☀️/🌙) + Avatar (direita)

---

## 📱 RESPONSIVIDADE

### **Desktop (>1024px)**
- Sidebar fixa à esquerda (250px)
- Conteúdo principal flex-1
- Navbar no topo

### **Tablet (768px-1024px)**
- Sidebar colapsável com botão toggle
- Cards em grid 2 colunas

### **Mobile (<768px)**
- Menu hamburguer
- Sidebar como drawer lateral
- Cards em 1 coluna
- Navegação inferior (bottom nav)

---

## 🎯 COMPONENTES ESPECÍFICOS POR TELA

### **1. Login (Print 1)**
```ejs
<!-- forms/login.ejs -->
- Split screen: 50% teal com info / 50% branco com form
- Logo LearnFlow no topo
- Campos: Email, Senha
- Botão "Entrar" (teal)
- Links: Esqueci senha, Cadastre-se
- Footer com estatísticas (500+ Cursos, 2.5k Professores, 15k Alunos)
```

### **2-5. Detalhes do Curso (Prints 2-5)**
```ejs
<!-- plataforma/curso/detalhes.ejs -->
Header teal com:
- Título do curso
- Subtítulo (ex: 3º Ano - Turma A)
- Nome do professor

Tabs de navegação:
- Mural (print 3-4)
- Aulas (print 8)
- Atividades (print 12-13)
- Pessoas (print 14)

Seção "Informações do Curso":
- Instrutor
- Número de aulas/atividades
- Barra de progresso com %
- Estatísticas
```

### **3-4. Mural do Curso (Prints 3-4)**
```ejs
<!-- plataforma/curso/mural/mural_curso.ejs -->
- Campo de texto para nova publicação
- Botão "Postar"
- Lista de publicações:
  - Avatar do autor (iniciais)
  - Nome e data
  - Conteúdo
  - Opção de comentários
  - Dropdown menu (3 pontos)
```

### **6-7. Sidebar + Dashboard (Prints 6-7)**
```ejs
<!-- partials/sidebar/sidebar_aluno.ejs -->
Seções:
- Logo no topo
- PRINCIPAL (Início, Meus Cursos, Chat)
- ADMIN (Dashboard, Usuários, Solicitações)
- CONTA (Perfil, Notificações, Configurações)
- Card do usuário no rodapé (avatar + nome + email)

<!-- plataforma/curso/inicio.ejs -->
- Título "Bem-vindo de volta!"
- Subtítulo
- Grid de cards de curso
- Cada card:
  - Imagem de capa
  - Título
  - Matéria
  - Avatar + nome do professor
  - Botões: Atividades, Mural
  - Menu de opções (3 pontos)
```

### **8. Lista de Aulas (Print 8)**
```ejs
<!-- plataforma/curso/aula/lista_aulas.ejs -->
- Botão "+ Nova Aula" (teal, canto superior direito)
- Seções colapsáveis:
  - Título da lista
  - Número de aulas
  - Lista de aulas:
    - Ícone play
    - Título
    - Descrição
    - Duração (ex: 45 min)
```

### **9-11. Modals de Criar Conteúdo (Prints 9-11)**
```ejs
<!-- partials/modals/modal_criar_aula.ejs -->
Tabs: Lista | Aula | Atividade | Material
Campos:
- Título da Aula
- Descrição
- Lista (select)
- Vídeo: URL YouTube OU Upload
- Botões: Cancelar, Criar Aula

<!-- partials/modals/modal_criar_atividade.ejs -->
Campos:
- Título da Tarefa
- Descrição
- Data de Entrega
- Lista (select)
- Botões: Cancelar, Criar Tarefa

<!-- partials/modals/modal_criar_material.ejs -->
Campos:
- Título do Material
- Descrição
- Lista (select)
- Tipo de Arquivo (select)
- Upload de Arquivo
- Botões: Cancelar, Criar Material
```

### **12-13. Lista de Atividades (Prints 12-13)**
```ejs
<!-- plataforma/curso/atividade/lista_atividades.ejs -->
- Botão "+ Criar" (teal, canto superior direito)
- Seções colapsáveis:
  - Título da lista
  - Número de atividades
  - Lista de atividades:
    - Ícone (documento ou quiz)
    - Título
    - Data de entrega
    - Status: Pendente (vermelho) ou Disponível (cinza) ou Em breve (cinza escuro)
```

### **14. Pessoas do Curso (Print 14)**
```ejs
<!-- plataforma/curso/pessoas/lista_pessoas.ejs -->
Seção Professores:
- Avatar com iniciais
- Nome
- Email
- Badge "Professor"
- Ícone de email

Seção Alunos:
- Grid de alunos
- Avatar com iniciais
- Nome
- Email
- Ícone de email
- Botão "+ Convidar alunos"

Estatísticas da Turma:
- Total de pessoas
- Alunos
- Professores
- % Participação
```

### **15-16. Perfil do Usuário (Prints 15-16)**
```ejs
<!-- plataforma/conta/perfil.ejs -->
Lado esquerdo:
- Avatar grande (iniciais)
- Nome
- Cargo (Professor/Aluno)
- Instituição
- Email
- Membro desde

Lado direito:
Informações Pessoais:
- Nome Completo (readonly)
- Email (readonly)

Informações Profissionais:
- Instituição (readonly)
- Cargo (readonly)

Estatísticas:
- Cursos, Aulas, Atividades

Botão "Editar Perfil" (canto superior direito)

<!-- plataforma/conta/editar_perfil.ejs -->
Mesmos campos, mas editáveis
Botões: Cancelar, Salvar
```

### **17-18. Notificações (Prints 17-18)**
```ejs
<!-- plataforma/conta/notificacoes.ejs -->
Header:
- Título "Notificações" com badge de contagem
- Botão "Marcar todas como lidas"

Lado esquerdo - Recentes:
- Lista de notificações:
  - Ícone colorido por tipo
  - Título
  - Descrição
  - Curso relacionado
  - Tempo (ex: 2 horas atrás)
  - Indicador de não lida (bolinha verde)
  - Ícones: email, deletar

Lado direito - Configurações:
- Métodos de Notificação (toggles):
  - Email
  - Push
- Tipos de Notificação (toggles):
  - Atividades
  - Avisos
  - Notas
  - Mensagens
  - Novos Cursos
- Resumo:
  - Não lidas (badge)
  - Total hoje
  - Total
```

### **19-20. Chat (Prints 19-20)**
```ejs
<!-- plataforma/chat/index.ejs -->
Lado esquerdo:
- Título "Conversas"
- Botão "+" para nova conversa
- Lista de conversas (vazia: "Nenhuma conversa ainda")

Lado direito:
- Estado vazio: "Bem-vindo ao Chat"
- Mensagem: "Selecione uma conversa ou inicie uma nova"

<!-- partials/modals/modal_criar_conversa.ejs -->
- Título "Nova Conversa"
- Lista de usuários com checkboxes
- Avatar com iniciais
- Nome
- Email
- Botão "Criar Conversa"
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar estrutura de pastas
2. ✅ Desenvolver partials (head, navbar, sidebar, footer)
3. ✅ Criar views de autenticação (login, cadastro)
4. ✅ Criar landing page
5. ✅ Desenvolver views de cursos
6. ✅ Criar sistema de modals
7. ✅ Implementar notificações
8. ✅ Criar interface de chat
9. ✅ Adicionar dark mode
10. ✅ Testar responsividade

---

## 📝 OBSERVAÇÕES IMPORTANTES

- **Dark Mode**: Toggle no navbar, armazena preferência em localStorage
- **Sidebar**: Fixa em desktop, colapsável em tablet, drawer em mobile
- **Modals**: Todos usam Tailwind + JavaScript puro (sem libs)
- **Icons**: Usar Heroicons ou Font Awesome
- **Forms**: Validação client-side e server-side
- **Loading**: Estados de loading em todas operações assíncronas
- **Acessibilidade**: ARIA labels, contraste adequado, navegação por teclado