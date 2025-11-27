// file: seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emailAdmin = "admin@learnflow.com";
  const senhaAdmin = "admin123"; // Mude isso para sua senha

  // Verifica se o admin já existe
  const adminExistente = await prisma.usuario.findUnique({
    where: { email: emailAdmin },
  });

  if (adminExistente) {
    console.log("Usuário administrador já existe.");
    return;
  }

  // Cria o hash da senha
  const senha_hash = await bcrypt.hash(senhaAdmin, 10);

  // Cria o usuário admin
  await prisma.usuario.create({
    data: {
      nome: "Admin LearnFlow",
      email: emailAdmin,
      senha: senha_hash,
      tipo: "administrador",
      status: "ativo",
    },
  });

  console.log("Usuário administrador criado com sucesso!");
  console.log(`Email: ${emailAdmin}`);
  console.log(`Senha: ${senhaAdmin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });