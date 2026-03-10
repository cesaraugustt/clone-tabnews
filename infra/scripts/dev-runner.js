const { spawn, execSync } = require("child_process");

console.log("Preparando a infraestrutura...");

try {
  execSync("npm run services:up", { stdio: "inherit" });

  execSync("npm run services:wait:database", { stdio: "inherit" });

  execSync("npm run migrations:up", { stdio: "inherit" });

  console.log("\n✅ Infraestrutura pronta!");
} catch (error) {
  console.error("\n❌ Falha durante a preparação do ambiente.");
  try {
    execSync("npm run services:stop", { stdio: "ignore" });
  } catch (e) {
    console.log(
      "Não foi possível parar os serviços automaticamente durante o rollback.",
    );
  }
  process.exit(1);
}

console.log("Iniciando o Next.js...\n");

const isWindows = process.platform === "win32";
const command = isWindows ? "npx.cmd" : "npx";

const devProcess = spawn(command, ["next", "dev"], {
  stdio: "inherit",
});

let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (!devProcess.killed) devProcess.kill();

  console.log("\n🛑 Encerrando o ambiente. Derrubando containers...");
  try {
    execSync("npm run services:stop", { stdio: "inherit" });
    console.log("✅ Containers derrubados e rede limpa.");
  } catch (error) {
    console.error("❌ Erro ao limpar os containers (ou já estavam parados).");
  }

  if (!devProcess.killed) devProcess.kill();
}

devProcess.on("close", (code) => {
  cleanup();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

if (process.platform !== "win32") {
  process.on("SIGHUP", () => {
    cleanup();
    process.exit(0);
  });
}
