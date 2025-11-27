// file: config/prisma.js
// Abstração para exportar uma instância única do PrismaClient
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;