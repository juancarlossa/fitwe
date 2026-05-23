const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Leyendo JSON...");

  const filePath = path.join(__dirname, "../ejercicios.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const exercises = JSON.parse(rawData);

  console.log(`📦 ${exercises.length} ejercicios encontrados`);

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: exercise,
      create: exercise,
    });

    console.log(`✅ ${exercise.name}`);
  }

  console.log("🎉 Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Error seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
